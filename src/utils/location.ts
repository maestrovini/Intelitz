export interface ParsedLocation {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const parseLocation = (locStr: string = ''): ParsedLocation => {
  let street = locStr.trim();
  let number = '';
  let complement = '';
  let neighborhood = '';
  let city = 'Porto Alegre';
  let state = 'RS';

  if (!locStr || !locStr.trim()) {
    return { street: '', number: '', complement: '', neighborhood: '', city, state };
  }

  try {
    let clean = locStr.replace(' - Bairro ', ' - ').trim();

    // Split on ' - ' first
    let firstPart = clean;
    let secondPart = '';

    const dashIdx = clean.indexOf(' - ');
    if (dashIdx !== -1) {
      firstPart = clean.substring(0, dashIdx).trim();
      secondPart = clean.substring(dashIdx + 3).trim();
    }

    if (firstPart && secondPart) {
      // firstPart contains street, number, complement (comma separated)
      const firstCommaParts = firstPart.split(',').map(s => s.trim()).filter(Boolean);
      if (firstCommaParts.length > 0) street = firstCommaParts[0];

      for (let i = 1; i < firstCommaParts.length; i++) {
        const p = firstCommaParts[i];
        if (p.toLowerCase().startsWith('nº') || p.toLowerCase().startsWith('no') || p.toLowerCase().startsWith('n°')) {
          number = p.replace(/^(nº|no|n°)\s*/i, '').trim();
        } else if (/^\d+[a-zA-Z]?$/.test(p) && !number) {
          number = p;
        } else {
          complement = complement ? `${complement}, ${p}` : p;
        }
      }

      // secondPart contains neighborhood, city - state or city/state
      const secondCommaParts = secondPart.split(',').map(s => s.trim()).filter(Boolean);
      if (secondCommaParts.length > 1) {
        neighborhood = secondCommaParts[0];
        const cityStatePart = secondCommaParts[1];
        const lastDash = cityStatePart.lastIndexOf('-');
        const lastSlash = cityStatePart.lastIndexOf('/');
        const sepIdx = Math.max(lastDash, lastSlash);
        if (sepIdx !== -1) {
          city = cityStatePart.substring(0, sepIdx).trim();
          state = cityStatePart.substring(sepIdx + 1).trim();
        } else {
          city = cityStatePart;
        }
      } else {
        // e.g. "Petrópolis - Porto Alegre - RS" or "Porto Alegre - RS"
        const secondDashParts = secondPart.split(' - ').map(s => s.trim()).filter(Boolean);
        if (secondDashParts.length >= 2) {
          neighborhood = secondDashParts[0];
          city = secondDashParts[1];
          if (secondDashParts.length >= 3) {
            state = secondDashParts[2];
          }
        } else {
          const slashIdx = secondPart.lastIndexOf('/');
          const dashIdx = secondPart.lastIndexOf('-');
          const sep = Math.max(slashIdx, dashIdx);
          if (sep !== -1) {
            city = secondPart.substring(0, sep).trim();
            state = secondPart.substring(sep + 1).trim();
          } else {
            neighborhood = secondPart;
          }
        }
      }
    } else {
      // Single string without ' - '
      const commaParts = clean.split(',').map(s => s.trim()).filter(Boolean);
      if (commaParts.length > 0) street = commaParts[0];
      if (commaParts.length >= 2) {
        const p2 = commaParts[1];
        if (p2.toLowerCase().startsWith('nº')) {
          number = p2.replace(/nº\s*/i, '').trim();
        } else {
          number = p2;
        }
      }
      if (commaParts.length >= 3) neighborhood = commaParts[2];
      if (commaParts.length >= 4) {
        const cs = commaParts[3];
        const dashIdx = cs.lastIndexOf('-');
        if (dashIdx !== -1) {
          city = cs.substring(0, dashIdx).trim();
          state = cs.substring(dashIdx + 1).trim();
        } else {
          city = cs;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing location:', e);
    street = locStr;
  }

  return { street, number, complement, neighborhood, city, state };
};

export const formatLocationString = ({
  street = '',
  number = '',
  complement = '',
  neighborhood = '',
  city = 'Porto Alegre',
  state = 'RS'
}: Partial<ParsedLocation>): string => {
  const streetStr = street.trim();
  const numberStr = number.trim() ? `, nº ${number.trim()}` : '';
  const complementStr = complement.trim() ? `, ${complement.trim()}` : '';
  const neighborhoodStr = neighborhood.trim() ? ` - ${neighborhood.trim()}` : '';
  const cityStateStr = `, ${city.trim() || 'Porto Alegre'} - ${state.trim() || 'RS'}`;
  return `${streetStr}${numberStr}${complementStr}${neighborhoodStr}${cityStateStr}`;
};

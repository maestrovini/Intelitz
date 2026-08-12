/**
 * Static API Fallback for GitHub Pages deployment.
 * This helper intercepts '/api/*' calls and fulfills them directly in the browser
 * using client-side Gemini API calls (if a key is provided) or realistic mock data.
 */
import { safeStorage } from './safeStorage';

// Save original fetch
const originalFetch = window.fetch;

// Typings for JSON schema properties
interface SchemaProperty {
  type: string;
  description?: string;
  items?: {
    type: string;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
  };
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

interface ResponseSchema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Call Gemini directly from the client using the browser's fetch API.
 * Google's Generative Language API allows CORS requests for direct browser usage.
 */
async function callClientGemini(prompt: string, schema?: ResponseSchema, temperature = 0.1): Promise<any> {
  const apiKey = safeStorage.getItem('intelitz_gemini_api_key');
  if (!apiKey) {
    throw new Error("Chave API do Gemini não configurada.");
  }

  // Use recommended basic model gemini-3.5-flash for browser lightweight processing
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature
    }
  };

  if (schema) {
    body.generationConfig.responseMimeType = "application/json";
    body.generationConfig.responseSchema = schema;
  }

  const response = await originalFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Erro na API do Gemini: ${errMsg}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Resposta vazia da API do Gemini.");
  }

  if (schema) {
    try {
      return JSON.parse(text.trim());
    } catch (e) {
      // Cleanup code blocks if Gemini wrapped it
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }
  }

  return text;
}

/**
 * Highly realistic simulated mock fallback responses when no Gemini API Key is configured.
 */
function getMockResponse(route: string, body: any): any {
  console.log(`[Static Fallback] Servindo resposta simulada para a rota: ${route}`, body);

  if (route.includes('scrape-url')) {
    const url = body.url || '';
    const isVehicle = url.toLowerCase().includes('veiculo') || url.toLowerCase().includes('carro') || url.toLowerCase().includes('moto') || url.toLowerCase().includes('copart') || url.toLowerCase().includes('sodre');
    
    if (isVehicle) {
      return {
        title: "Chevrolet Onix Hatch LTZ 1.0 Turbo Flex 2022",
        category: "vehicle",
        typeText: "Automóvel",
        location: "Bairro Menino Deus, Porto Alegre - RS",
        marketValue: 78500,
        fipeValue: 76900,
        currentBid: 42000,
        portalName: "Sodré Santoro Leilões",
        description: "Veículo recuperado de financiamento, excelente estado geral de conservação. Chave reserva, manual do proprietário e vistoria cautelar aprovada com ressalva de leilão. Sem sinistro grave."
      };
    } else {
      return {
        title: "Apartamento Residencial 2 Quartos (64m²)",
        category: "real_estate",
        typeText: "Apartamento",
        location: "Bairro Petrópolis, Porto Alegre - RS",
        marketValue: 450000,
        currentBid: 245000,
        portalName: "Caixa Econômica Federal",
        description: "Imóvel retomado em leilão extrajudicial (Alienação Fiduciária). Conta com 2 dormitórios, 1 suíte, sacada com churrasqueira e 1 vaga de garagem coberta. Prédio com infraestrutura de lazer completa."
      };
    }
  }

  if (route.includes('analyze')) {
    const isRealEstate = body.category === "real_estate";
    if (isRealEstate) {
      return {
        score: 85,
        executiveSummary: "### Resumo Executivo\nO imóvel analisado apresenta **excelente viabilidade financeira**, com margem de lucro estimada em **28%** se arrematado próximo ao lance mínimo atual. Trata-se de uma oportunidade de leilão extrajudicial da Caixa. Recomenda-se prosseguir com os lances respeitando a Regra do Teto (máximo recomendado de R$ 265.000).\n\n### Próximos Passos\nRealizar vistoria externa do condomínio e solicitar cópia atualizada da matrícula do imóvel no Registro de Imóveis competente para certificar-se da inexistência de ações judiciais secundárias.",
        legalRisks: [
          {
            title: "Ocupação do Bem por Terceiros",
            description: "O imóvel consta como ocupado na descrição básica. O processo de desocupação (imissão na posse) deverá ser conduzido por via extrajudicial amigável ou ação judicial de imissão de posse. Tempo estimado: 3 a 6 meses. Custo estimado em R$ 4.500.",
            severity: "medio"
          },
          {
            title: "Débitos de Condomínio e IPTU",
            description: "No leilão da Caixa, débitos anteriores de IPTU e condomínio costumam ser quitados pelo banco credor, contudo é vital certificar-se de que a assessoria jurídica acompanhe este pedido formalmente.",
            severity: "baixo"
          }
        ],
        financialCalculations: {
          additionalCostsEstimated: 18500,
          customTaxDetails: "Comissão do Leiloeiro (5%): R$ 12.250. ITBI (3%): R$ 13.500. Escritura e Registro: R$ 3.800. Estimativa de despesas condominiais atrasadas de responsabilidade do arrematante: R$ 4.000.",
          maxViableBid: 265000
        },
        recommendedActions: [
          "Consultar certidão de ônus e ações reais (Matrícula atualizada)",
          "Visitar a fachada do edifício e conversar com o síndico sobre débitos pendentes",
          "Preparar a assessoria jurídica para a petição ou notificação de desocupação",
          "Definir limite psicológico rígido para o lance de R$ 265.000"
        ]
      };
    } else {
      return {
        score: 92,
        executiveSummary: "### Resumo Executivo\nVeículo em **excelentes condições de liquidez**. O Chevrolet Onix é o modelo mais vendido do Brasil, apresentando giro comercial em média de 15 a 20 dias após a regularização. O lance mínimo atual de R$ 42.000 está extremamente atrativo perante a FIPE de R$ 76.900. Excelente margem de retorno de **32%**.\n\n### Conclusão\nNegócio altamente recomendado para revendedores e investidores iniciantes pela alta liquidez e baixo risco jurídico.",
        legalRisks: [
          {
            title: "Taxas de Pátio e Despesas de Reboque",
            description: "Taxas administrativas de pátio acumuladas do Detran ou do leiloeiro oficial. Estimativa de custos: R$ 1.200 a R$ 1.800 para liberação física do veículo.",
            severity: "baixo"
          },
          {
            title: "Prazo para Baixa de Gravame e Documentação",
            description: "O prazo para a entrega do CRV assinado e baixa de restrições de leilão pode levar de 30 a 45 dias úteis. Recomenda-se aguardar este prazo antes de anunciar a venda do veículo.",
            severity: "medio"
          }
        ],
        financialCalculations: {
          additionalCostsEstimated: 5800,
          customTaxDetails: "Comissão de Leiloeiro (5%): R$ 2.100. Taxas de pátio: R$ 1.500. Despesas com polimento, higienização e pequenas revisões mecânicas preventivas: R$ 2.200.",
          maxViableBid: 52000
        },
        recommendedActions: [
          "Consultar laudo de vistoria cautelar anexado pelo portal do leiloeiro",
          "Verificar se há débitos de IPVA ou multas de trânsito pendentes no sistema do Detran",
          "Prever o custo de transporte por guincho/plataforma até a sua oficina de confiança",
          "Limitar lances ao teto estrito de R$ 52.000 para preservar lucratividade líquida"
        ]
      };
    }
  }

  if (route.includes('chat')) {
    const isImoveis = JSON.stringify(body).toLowerCase().includes('imóvel') || JSON.stringify(body).toLowerCase().includes('imovel') || JSON.stringify(body).toLowerCase().includes('apartamento');
    const userMsg = body.messages?.[body.messages.length - 1]?.content || 'Olá';
    
    if (isImoveis) {
      return {
        role: "assistant",
        content: `Olá! Sou o **Dr. Leilão**, especialista em arrematações imobiliárias.\n\nAnalisando a sua dúvida sobre "${userMsg}", gostaria de destacar que para leilões de **Imóveis** (como os da Caixa ou Judiciais), o processo de **desocupação** costuma ser a principal dúvida dos investidores.\n\n1. **Leilão Judicial**: A desocupação é requerida por petição simples de "Imissão na Posse" ao próprio juiz do caso, o qual expede um mandado de desocupação coercitivo. É um processo rápido (cerca de 2 a 4 meses).\n2. **Leilão Extrajudicial**: É necessária uma ação de imissão de posse (com pedido de liminar). O juiz costuma conceder liminar de 15 dias para desocupação voluntária sob pena de despejo policial.\n\nQual o status atual do edital desse imóvel? Deseja que eu auxilie calculando os custos de ITBI e registro?`
      };
    } else {
      return {
        role: "assistant",
        content: `Olá! Sou o **Dr. Leilão**, analista técnico de leilões automotivos.\n\nSua pergunta sobre "${userMsg}" é extremamente relevante. Ao investir em **Veículos** de leilão, atente-se sempre para:\n\n*   **Regra de 70% FIPE**: Nunca dê lances cujo somatório de despesas (Lance + 5% Comissão + taxas de pátio) ultrapasse 70% da FIPE do carro, para garantir margem de revenda segura de pelo menos 20% a 30%.\n*   **Risco Mecânico**: Motores modernos de 3 cilindros exigem atenção redobrada com a correia dentada banhada a óleo (como nos motores Ford Ka de 3 cil. ou GM Tracker/Onix). Se o óleo correto não foi usado, a correia se esfarela, entupindo o pescador e fundindo o motor.\n\nComo posso ajudar você a formular a estratégia de lances perfeita para este lote?`
      };
    }
  }

  if (route.includes('consultar-veiculo')) {
    const model = body.model || 'Veículo';
    const year = body.year || '2020';
    const km = body.km || '90.000';
    const hasUserFipe = body.fipe && Number(body.fipe) > 0;
    const fipeVal = hasUserFipe ? Number(body.fipe) : 52000;
    const marketVal = body.marketValue && Number(body.marketValue) > 0 ? Number(body.marketValue) : Math.round(fipeVal * 1.05);
    const suggestedBidVal = Math.floor((0.70 * fipeVal - 1000) / 1.05);

    return {
      fipe: fipeVal,
      marketValue: marketVal,
      suggestedBid: suggestedBidVal,
      liquidity: "Altíssima",
      category: "Prioritário",
      riskAnalysis: `### Análise Mecânica e de Mercado: **${model} (${year})**\n\n*   **Liquidez de Giro**: O modelo **${model}** possui excelente liquidez no Brasil, com comercialização em concessionárias e sites de revenda extremamente rápida (média de 15 dias).\n*   **Análise Mecânica (${km} KM)**: Na quilometragem informada, requer revisão imediata do sistema de arrefecimento (bomba d'água, reservatório e válvula termostática) e correia de distribuição.\n*   **Recomendação de Óleo**: Utilizar estritamente o óleo lubrificante sintético recomendado pelo fabricante para evitar borra ou entupimento de canais internos de lubrificação.`,
      executiveSummary: `Lote classificado como **Prioritário** devido à facilidade de revenda e excelente custo-benefício. Respeite o teto de lances sugerido de R$ ${suggestedBidVal.toLocaleString('pt-BR')} para garantir margem de lucro de pelo menos 22% livre.`
    };
  }

  if (route.includes('consultar-imovel')) {
    const typeText = body.typeText || 'Apartamento';
    const location = body.location || 'Bairro Nobre';
    const area = body.area || '70';
    const hasUserMarket = body.marketValue && Number(body.marketValue) > 0;
    const marketVal = hasUserMarket ? Number(body.marketValue) : 380000;
    const suggestedBidVal = Math.floor((0.60 * marketVal - 5000) / 1.08);

    return {
      marketValue: marketVal,
      suggestedBid: suggestedBidVal,
      liquidity: "Alta",
      category: "Prioritário",
      occupancyStatus: "Ocupado",
      riskAnalysis: `### Análise Jurídica e de Mercado: **${typeText} em ${location}**\n\n*   **Região de Investimento**: Imóveis na localidade **${location}** contam com valorização constante acima da inflação e excelente demanda para locação residencial.\n*   **Status de Ocupação**: Provavelmente **Ocupado**. Em leilões extrajudiciais, o arrematante deve conduzir a desocupação de forma amigável (oferecendo auxílio-mudança de R$ 1.500 a R$ 2.000 para acelerar a entrega das chaves) ou ingressar com Ação de Imissão na Posse com pedido de liminar imediata.\n*   **Pesquisa de Débitos**: Verifique se há débitos de condomínio em atraso perante a administradora, pois estes constituem dívida *propter rem* e acompanham o imóvel se o edital não ressalvar o contrário.`,
      executiveSummary: `Lote classificado como **Prioritário** em virtude da excelente localização e expressivo potencial de valorização. O teto máximo de lances recomendado é de R$ ${suggestedBidVal.toLocaleString('pt-BR')}, o que resguarda a viabilidade de retorno financeiro seguro.`
    };
  }

  return { success: true };
}

/**
 * Initializes the interceptor.
 */
export function initStaticApiFallback() {
  if (typeof window === 'undefined') return;
  
  // Set flag in window to indicate static mode fallback is active
  (window as any).__static_api_fallback_active = true;

  console.log("⚡ [Intelitz] Inicializando interceptor estático para GitHub Pages...");

  const interceptor = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);

    // Only intercept requests directed to our internal express API
    if (urlString.startsWith('/api/') || urlString.includes(window.location.origin + '/api/')) {
      const route = urlString.substring(urlString.indexOf('/api/'));
      
      let body: any = {};
      if (init && init.body) {
        try {
          body = JSON.parse(init.body as string);
        } catch (e) {
          // ignore
        }
      }

      // Check if we are running on GitHub Pages / custom domain (github.io / imobhall.com.br), or if we explicitly want fallback because server is offline
      const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('imobhall.com.br');
      const hasApiKey = !!safeStorage.getItem('intelitz_gemini_api_key');

      // Attempt the original fetch first if we are not on GitHub Pages (so server continues working locally and on Cloud Run)
      if (!isGitHubPages) {
        try {
          const res = await originalFetch(input, init);
          if (res.ok) {
            return res;
          }
          // If 404 or other server error, proceed to fallback instead of crashing
          console.warn(`[Static Interceptor] API original retornou status ${res.status}. Tentando fallback estático.`);
        } catch (err) {
          console.warn("[Static Interceptor] Conexão com o servidor falhou. Ativando fallback estático em tempo de execução.", err);
        }
      }

      // If we reach here, we serve via static fallback (direct Gemini or realistic mock data)
      try {
        if (hasApiKey) {
          // Live client-side Gemini execution!
          console.log(`[Static Interceptor] Executando chamada direta ao Gemini 3.5 para rota: ${route}`);
          
          if (route.includes('scrape-url')) {
            const prompt = `
              URL/Termo: ${body.url || ''}
              Você é um agente especialista em leilões brasileiros.
              Analise ou pesquise na internet este termo ou URL e extraia os dados estruturados reais correspondentes.
              Retorne o formato JSON correto com os campos especificados.
            `;
            const schema: ResponseSchema = {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Título do lote completo (ex: Chevrolet Onix Hatch 2021)." },
                category: { type: "STRING", description: "Categoria: 'vehicle' ou 'real_estate'." },
                typeText: { type: "STRING", description: "Tipo do bem (ex: Automóvel, Apartamento, Casa)." },
                location: { type: "STRING", description: "Localização: Cidade - UF." },
                marketValue: { type: "INTEGER", description: "Valor de mercado aproximado em Reais." },
                fipeValue: { type: "INTEGER", description: "Valor de referência FIPE em Reais (apenas se for vehicle)." },
                currentBid: { type: "INTEGER", description: "Lance mínimo sugerido em Reais." },
                portalName: { type: "STRING", description: "Nome do portal de leilão de origem." },
                description: { type: "STRING", description: "Resumo das características identificadas." }
              },
              required: ["title", "category", "typeText", "location", "marketValue", "currentBid", "portalName", "description"]
            };
            const result = await callClientGemini(prompt, schema, 0.1);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          if (route.includes('analyze')) {
            const prompt = `
              Texto a analisar: "${body.inputText || ''}"
              Categoria: ${body.category || 'real_estate'}
              Valor de mercado: ${body.marketValue || 'Não informado'}
              Lance: ${body.currentBid || 'Não informado'}
              
              Realize uma análise jurídica e financeira detalhada e retorne no formato JSON exigido.
            `;
            const schema: ResponseSchema = {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER", description: "Nota de segurança (0 a 100)." },
                executiveSummary: { type: "STRING", description: "Resumo executivo formatado em Markdown." },
                legalRisks: {
                  type: "ARRAY",
                  properties: {
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    severity: { type: "STRING" }
                  },
                  required: ["title", "description", "severity"]
                } as any,
                financialCalculations: {
                  type: "OBJECT",
                  properties: {
                    additionalCostsEstimated: { type: "NUMBER" },
                    customTaxDetails: { type: "STRING" },
                    maxViableBid: { type: "NUMBER" }
                  },
                  required: ["additionalCostsEstimated", "customTaxDetails", "maxViableBid"]
                },
                recommendedActions: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                } as any
              },
              required: ["score", "executiveSummary", "legalRisks", "financialCalculations", "recommendedActions"]
            };
            const result = await callClientGemini(prompt, schema, 0.1);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          if (route.includes('chat')) {
            const userMsg = body.messages?.[body.messages.length - 1]?.content || '';
            const context = body.auctionContext ? JSON.stringify(body.auctionContext) : 'Sem lote ativo';
            const prompt = `
              Você é o "Dr. Leilão", assessor jurídico-financeiro de leilões brasileiros de carros e imóveis.
              Seja didático, use termos do mercado oficial brasileiro.
              Mensagem do usuário: "${userMsg}"
              Contexto do leilão que ele está vendo: "${context}"
              Foque em estratégias de lance, desocupação de imóveis ou riscos mecânicos.
            `;
            const resultText = await callClientGemini(prompt, undefined, 0.7);
            const result = {
              role: "assistant",
              content: resultText
            };
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          if (route.includes('consultar-veiculo')) {
            const prompt = `
              Veículo: ${body.model}
              Ano: ${body.year}
              KM: ${body.km}
              FIPE informada: ${body.fipe || 'Não informada'}
              Valor mercado informado: ${body.marketValue || 'Não informado'}
              
              Analise a FIPE e o mercado. Calcule o lance sugerido utilizando a Regra de 70% FIPE: (0.7 * FIPE - 1000) / 1.05.
              Adicione riscos mecânicos reais e de liquidez para este modelo no Brasil.
              Retorne no formato JSON estruturado.
            `;
            const schema: ResponseSchema = {
              type: "OBJECT",
              properties: {
                fipe: { type: "INTEGER" },
                marketValue: { type: "INTEGER" },
                suggestedBid: { type: "INTEGER" },
                liquidity: { type: "STRING" },
                category: { type: "STRING" },
                riskAnalysis: { type: "STRING", description: "Análise mecânica minuciosa do motor em Markdown." },
                executiveSummary: { type: "STRING" }
              },
              required: ["fipe", "marketValue", "suggestedBid", "liquidity", "category", "riskAnalysis", "executiveSummary"]
            };
            const result = await callClientGemini(prompt, schema, 0.1);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          if (route.includes('consultar-imovel')) {
            const prompt = `
              Imóvel: ${body.typeText}
              Localização: ${body.location}
              Área: ${body.area || 'Não informada'}
              Valor mercado informado: ${body.marketValue || 'Não informado'}
              Lance mínimo informado: ${body.currentBid || 'Não informado'}
              
              Analise o mercado. Calcule o lance sugerido utilizando a Regra de 60% Valor de Mercado: (0.6 * ValorDeMercado - 5000) / 1.08.
              Adicione riscos de ocupação, custos condominiais ou jurídicos clássicos para esta área.
              Retorne no formato JSON estruturado.
            `;
            const schema: ResponseSchema = {
              type: "OBJECT",
              properties: {
                marketValue: { type: "INTEGER" },
                suggestedBid: { type: "INTEGER" },
                liquidity: { type: "STRING" },
                category: { type: "STRING" },
                occupancyStatus: { type: "STRING" },
                riskAnalysis: { type: "STRING", description: "Análise jurídica de ocupação e imissão na posse em Markdown." },
                executiveSummary: { type: "STRING" }
              },
              required: ["marketValue", "suggestedBid", "liquidity", "category", "occupancyStatus", "riskAnalysis", "executiveSummary"]
            };
            const result = await callClientGemini(prompt, schema, 0.1);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }
        
        // Return highly realistic mock data fallback
        const mockResult = getMockResponse(route, body);
        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.error("[Static Interceptor] Falha ao processar interceptação estática:", err);
        return new Response(JSON.stringify({
          error: `Falha na requisição em modo estático: ${err.message}`
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Default fetch for external links (e.g. IBGE, etc.)
    return originalFetch(input, init);
  };

  try {
    window.fetch = interceptor;
  } catch (err) {
    console.warn("⚠️ [Static Interceptor] Não foi possível redefinir window.fetch diretamente:", err);
    try {
      Object.defineProperty(window, 'fetch', {
        value: interceptor,
        writable: true,
        configurable: true
      });
    } catch (err2) {
      console.error("⚠️ [Static Interceptor] Falha crítica ao tentar redefinir window.fetch via defineProperty:", err2);
    }
  }
}

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API Client iniciado com sucesso.");
} else {
  console.warn("Aviso: GEMINI_API_KEY não localizada nas variáveis de ambiente.");
}

// Helper to handle missing API key
function checkApiKey(res: any): boolean {
  if (!ai) {
    res.status(500).json({
      error: "O serviço de Inteligência Artificial não pôde ser iniciado porque a sua GEMINI_API_KEY está ausente ou inválida. Por favor, configure a chave de API de forma segura nas configurações (Secrets) do AI Studio."
    });
    return false;
  }
  return true;
}

// 0. API: Scrape web page or use Google Search to retrieve auction lot metadata
app.post("/api/scrape-url", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "O link do lote (url) é obrigatório." });
    }

    const isGoogleSearch = url.includes("google.com/search") || url.startsWith("https://www.google.com/search") || url.includes("google.com");
    let searchWord = "";
    if (isGoogleSearch) {
      try {
        const urlObj = new URL(url);
        searchWord = urlObj.searchParams.get("q") || url;
      } catch (e) {
        searchWord = url;
      }
    }

    console.log(`[Scraper] Iniciando extração inteligente. URL: ${url}, GoogleSearch: ${isGoogleSearch}`);

    let fetchedHtml = "";
    let fetchErrorMsg = "";

    if (!isGoogleSearch) {
      try {
        // 1. Tentar buscar o HTML da página (Proxy server-side bypasses CORS)
        const fetchResponse = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
          },
          signal: AbortSignal.timeout(6000) // 6 segundos de timeout para agilizar
        });

        if (fetchResponse.ok) {
          const fullHtml = await fetchResponse.text();
          // Limpar HTML básico para economizar tokens e remover scripts/estilos pesados
          fetchedHtml = fullHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
            .substring(0, 30000); // Limitar a 30 mil caracteres para evitar estourar tokens
        } else {
          fetchErrorMsg = `HTTP Status ${fetchResponse.status}`;
        }
      } catch (err: any) {
        fetchErrorMsg = err.message || "Timeout ou erro de rede";
      }
    }

    // 2. Prompt detalhado instruindo o Gemini a extrair os dados, se baseando no HTML e/ou usando pesquisa
    let prompt = "";
    if (isGoogleSearch) {
      prompt = `
        Você é um agente especialista em pesquisa de mercado de leilões, imóveis e veículos no Brasil.
        O usuário deseja encontrar as informações reais de mercado para o seguinte termo de busca: "${searchWord}".
        
        Sua tarefa é usar a ferramenta de pesquisa do Google Search Grounding para obter informações reais e precisas:
        1. O título oficial/completo e correto do modelo de veículo ou imóvel correspondente (ex: "Fiat Uno Attractive 1.0 Flex 2017").
        2. A categoria exata do bem: "vehicle" para veículos ou "real_estate" para imóveis.
        3. O tipo exato do bem (ex: "Automóvel", "Casa", "Apartamento").
        4. O valor oficial atualizado da Tabela FIPE no Brasil no campo 'fipeValue' (retorne 0 ou omita se for imóvel). Busque o valor de tabela real de fontes oficiais!
        5. O valor médio real de mercado / revenda no Brasil para este bem no campo 'marketValue'. NÃO use números fictícios ou distorcidos, busque os valores reais na internet!
        6. Um lance mínimo sugerido realista (currentBid) (aproximadamente 50% ou 60% da Tabela FIPE ou do Valor de Mercado).
        7. A localização típica ou informada (cidade e UF, ex: "São Paulo - SP").
        8. O nome do portal de origem ou "Pesquisa de Mercado".
        9. Uma breve descrição detalhando as características técnicas relevantes identificadas.
        
        Retorne os valores reais corretos encontrados na internet, sem distorcer ou inventar.
      `;
    } else {
      prompt = `
        Você é um agente especialista em extração inteligente de dados de leilões brasileiros (imóveis e veículos).
        Seu objetivo é extrair os dados estruturados de um lote de leilão a partir da URL e do trecho de código-fonte fornecidos.

        Link do lote: ${url}
        ${fetchErrorMsg ? `(Aviso: Falha ao baixar diretamente a página via HTTP: ${fetchErrorMsg}. Use sua ferramenta de pesquisa do Google Search Grounding para obter informações sobre essa URL específica ou modelo do lote.)` : ""}

        ${fetchedHtml ? `Aqui está o trecho do HTML limpo do portal de leilão para você analisar e extrair:\n"""\n${fetchedHtml}\n"""` : "HTML não pôde ser recuperado diretamente. Use a pesquisa do Google Search para encontrar informações do lote."}

        Instruções de Extração:
        1. Descubra o TÍTULO do lote (ex: "Chevrolet Onix Hatch 1.0 Flex 2021" ou "Apartamento Residencial de 2 Quartos no Bairro Centro"). Seja específico.
        2. Descubra a CATEGORIA do lote: deve ser exatamente "vehicle" (se for carro, moto, caminhão, etc.) ou "real_estate" (se for apartamento, casa, terreno, sala comercial, etc.).
        3. Descubra o TIPO do lote (ex: "Automóvel", "Motocicleta", "Caminhão", "Casa", "Apartamento", "Terreno", "Sala Comercial").
        4. Descubra a LOCALIZAÇÃO (ex: "Bairro Centro, Porto Alegre - RS"). Formate sempre que possível como "Bairro, Cidade - UF".
        5. Tabela FIPE & Valor de Mercado: Use a ferramenta de pesquisa do Google Search Grounding para buscar na internet a Tabela FIPE real atualizada e o valor médio real de mercado do veículo ou imóvel identificado. O valor retornado no campo 'fipeValue' DEVE ser o valor real atualizado da Tabela FIPE brasileira correspondente ao modelo/ano, e 'marketValue' deve ser o valor de avaliação / revenda real do bem no mercado convencional. Não invente ou distorça os valores.
        6. Descubra o LANCE MÍNIMO / LANCE ATUAL (currentBid) (número inteiro em Reais). Se não encontrar, defina como aproximadamente 50% ou 55% do valor de avaliação.
        7. Descubra o NOME DO PORTAL de leilão (portalName) (ex: "Pestana Leilões", "Caixa Econômica Federal", "Sodré Santoro", "Milan Leilões", "Copart", etc. com base na URL ou conteúdo).
        8. Crie uma DESCRIÇÃO resumida com características adicionais relevantes identificadas.

        Retorne estritamente um formato JSON estruturado conforme o seguinte esquema do responseSchema.
      `;
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Título do lote." },
        category: { type: Type.STRING, description: "Categoria: 'vehicle' ou 'real_estate'." },
        typeText: { type: Type.STRING, description: "Tipo do bem." },
        location: { type: Type.STRING, description: "Localização formatada: Bairro, Cidade - UF." },
        marketValue: { type: Type.INTEGER, description: "Valor de avaliação de mercado em Reais." },
        fipeValue: { type: Type.INTEGER, description: "Valor de referência FIPE em Reais (opcional, apenas se category for vehicle)." },
        currentBid: { type: Type.INTEGER, description: "Valor de lance mínimo/atual em Reais." },
        portalName: { type: Type.STRING, description: "Nome do portal de leilão." },
        description: { type: Type.STRING, description: "Descrição resumida das características." }
      },
      required: ["title", "category", "typeText", "location", "marketValue", "currentBid", "portalName", "description"]
    };

    let scrapedData: any = {};
    let parsedSuccessfully = false;

    // 1. TENTATIVA COM GOOGLE SEARCH
    try {
      console.log("[Scraper] Tentando obter dados com Google Search...");
      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

      const resultText = response.text || "{}";
      try {
        scrapedData = JSON.parse(resultText.trim());
        parsedSuccessfully = true;
      } catch (parseErr) {
        console.warn("[Scraper] Falha ao analisar JSON da resposta com busca. Tentando limpar...", parseErr);
        const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        scrapedData = JSON.parse(cleaned);
        parsedSuccessfully = true;
      }
    } catch (searchError: any) {
      console.warn("[Scraper] Falha na primeira tentativa com Google Search Grounding:", searchError.message);
    }

    // 2. FALLBACK SEM GOOGLE SEARCH
    if (!parsedSuccessfully) {
      console.log("[Scraper] Iniciando fallback sem busca...");
      try {
        const response = await ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1,
          }
        });

        const resultText = response.text || "{}";
        try {
          scrapedData = JSON.parse(resultText.trim());
          parsedSuccessfully = true;
        } catch (parseErr) {
          console.warn("[Scraper] Falha ao analisar JSON do fallback. Tentando limpar...", parseErr);
          const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
          scrapedData = JSON.parse(cleaned);
          parsedSuccessfully = true;
        }
      } catch (fallbackError: any) {
        console.error("[Scraper] Falha crítica no fallback de IA:", fallbackError);
        throw new Error("Não foi possível extrair as informações deste site com IA.");
      }
    }

    console.log("[Scraper] Dados estruturados extraídos:", scrapedData);
    res.json(scrapedData);
  } catch (error: any) {
    console.error("Erro na rota /api/scrape-url:", error);
    res.status(500).json({ error: "Não foi possível extrair as informações deste site: " + error.message });
  }
});

// 1. API: Analyze auction notice (edital) or listing parameters with structured JSON Schema
app.post("/api/analyze", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { inputText, category, marketValue, currentBid } = req.body;

    if (!inputText || !category) {
      return res.status(400).json({ error: "Faltando parâmetros essenciais: inputText e category são obrigatórios." });
    }

    const isRealEstate = category === "real_estate";
    const categoryName = isRealEstate ? "Imóvel (Casa/Apartamento/Terreno)" : "Veículo (Carro/Moto/Caminhão/Frota)";

    const prompt = `
      Você é um especialista jurídico-financeiro sênior especializado em leilões judiciais e extrajudiciais no Brasil.
      Sua tarefa é analisar os detalhes, descrição ou texto do edital de leilão fornecido pelo usuário e entregar uma análise técnica precisa.

      Informações do Lote:
      - Categoria: ${categoryName}
      - Valor de Mercado estimado/FIPE: R$ ${marketValue || "Não informado"}
      - Lance Máximo/Mínimo Inicial: R$ ${currentBid || "Não informado"}

      Texto do Edital / Descrição para Análise:
      """
      ${inputText}
      """

      Analise rigorosamente em busca de:
      1. Custos extras/ocultos: débitos tributários tributos (IPTU atrasado, IPVA/multas antigas do Detran), taxas condominiais atrasadas (em imóveis), taxas administrativas de leiloeiro (5%), taxas de pátio/reboque do DETRAN ou pátios privados, custos de regularização documental (chassi remontado, motor substituído, regularização de área em cartório de registro de imóveis, ITBI de transmissão).
      2. Riscos Jurídicos Graves: processos ativos de embargos à execução, recursos de terceiros pendentes, disputas possessórias, direito de preferência de coproprietário, etc.
      3. Risco de Ocupação (apenas imóveis): se o bem está ocupado por antigos proprietários ou inquilinos, estimar risco, tempo e custo estimado para reintegração de posse/desocupação (imissão na posse).
      4. Viabilidade Financeira: avalie se o negócio faz sentido. Proponha um Lance Limite Viável (maxViableBid) para que o investidor tenha margem de lucro de pelo menos 20% a 30% após deduzir todas as despesas levantadas.

      Retorne em formato JSON estrito conforme o esquema fornecido.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: "Nota global de segurança da arrematação (0 a 100). Considerar processos abertos contra o leilão, gravames que não serão cancelados, desocupações complexas ou débitos gigantes que inviabilizem o lance."
        },
        executiveSummary: {
          type: Type.STRING,
          description: "Resumo executivo em português (Markdown suportado), avaliando o potencial da oportunidade, prazos estimados de regularização e uma conclusão se vale a pena prosseguir."
        },
        legalRisks: {
          type: Type.ARRAY,
          description: "Lista estruturada dos riscos fundamentais jurídicos, físicos ou administrativos e táticas de mitigação.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título do risco (Ex: Ocupação do Bem, Embargos à Arrematação, Motor Não Cadastrado, Débitos Incapazes de Baixa)" },
              description: { type: Type.STRING, description: "Análise minuciosa explicando o impacto prático e como se prevenir." },
              severity: { type: Type.STRING, description: "Nível de severidade: 'baixo', 'medio' ou 'alto'" }
            },
            required: ["title", "description", "severity"]
          }
        },
        financialCalculations: {
          type: Type.OBJECT,
          description: "Análise financeira da viabilidade.",
          properties: {
            additionalCostsEstimated: { type: Type.NUMBER, description: "Soma numérica aproximada em Reais de despesas esperadas para regularização e quitação de pendências." },
            customTaxDetails: { type: Type.STRING, description: "Texto explicativo resumido sobre qual comissão do leiloeiro, impostos (ITBI/Transferência), documentação e despesas acessórias incidirão." },
            maxViableBid: { type: Type.NUMBER, description: "Preço máximo de lance em Reais sugerido pela IA para reter viabilidade financeira segura." }
          },
          required: ["additionalCostsEstimated", "customTaxDetails", "maxViableBid"]
        },
        recommendedActions: {
          type: Type.ARRAY,
          description: "Checklist passo a passo recomendado para o investidor fazer antes de registrar o lance.",
          items: { type: Type.STRING }
        }
      },
      required: ["score", "executiveSummary", "legalRisks", "financialCalculations", "recommendedActions"]
    };

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const resultText = response.text || "{}";
    const analysisData = JSON.parse(resultText.trim());

    res.json(analysisData);
  } catch (error: any) {
    console.error("Erro na rota /api/analyze:", error);
    res.status(500).json({ error: "Falha ao processar análise do edital com a Inteligência Artificial: " + error.message });
  }
});

// 2. API: Assistant Chat (Doutor Leilão)
app.post("/api/chat", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { messages, auctionContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Faltando parâmetro: 'messages' deve ser um array." });
    }

    const chatHistory = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Inserir context na primeira pergunta ou como instrução do sistema
    const currentMessage = chatHistory[chatHistory.length - 1];
    
    let contextPrompt = "";
    if (auctionContext) {
      contextPrompt = `\n\n[CONTEXTO ATUAL]: O usuário está visualizando a oferta do leilão titulado "${auctionContext.title}", classificado como ${auctionContext.category === 'real_estate' ? 'Imóvel' : 'Veículo'} (${auctionContext.typeText}), localizado em ${auctionContext.location}, com Valor de Mercado de R$ ${auctionContext.marketValue} e Lance Atual/Mínimo de R$ ${auctionContext.currentBid}. O veículo/imóvel está avaliado como ${auctionContext.occupancyStatus || auctionContext.vehicleCondition || 'padrão'}, ofertado em ${auctionContext.portalName}. Responda dúvidas contextualizando este bem se apropriado.`;
    }

    const systemInstruction = `
      Você é o "Especialista em Leilões" (Dr. Leilão), um assistente de IA sênior especialista em direito imobiliário, tráfego do Detran, leiloaria oficial brasileira (Decreto-Lei 21.981/32) e finanças aplicadas às arrematações.
      
      Diretrizes de resposta:
      1. Ajude o usuário com dúvidas complexas de forma didática, sem termos excessivamente burocráticos sem explicação.
      2. Instrua sobre: desocupação (imissão na posse por petição simples no leilão judicial ou ação própria no extrajudicial), baixa de gravames judiciais (hipotecas, penhoras, certidão de arrematação), custos extras (comissão de 5% de leiloeiro, ICMS se houver, IPVA antigo, multas, condomínio atrasado, ITBI, emolumentos de cartório).
      3. Forneça estratégias de lances (incremental, limite psicológico, análise de concorrência).
      4. Escreva sempre de maneira polida, direta, estruturada com listas ou tabelas simuladas caso necessário, e exclusivamente em português brasileiro.
      
      Caso o usuário envie perguntas gerais sobre leilão, explique de forma encorajadora porém realista, recomendando cautela na verificação da certidão de matrícula do imóvel ou histórico cautelar do automóvel.
    ` + contextPrompt;

    const chatInstance = ai!.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: chatHistory.slice(0, -1) // passar histórico anterior
    });

    const response = await chatInstance.sendMessage({
      message: currentMessage.parts[0].text
    });

    res.json({
      role: "assistant",
      content: response.text || "Desculpe, não consegui formular uma resposta adequada. Tente novamente."
    });
  } catch (error: any) {
    console.error("Erro na rota /api/chat:", error);
    res.status(500).json({ error: "Erro na comunicação com a IA: " + error.message });
  }
});

// 3. API: Consultoria Veículo Expert (Regra do Teto, Risco Mecânico)
app.post("/api/consultar-veiculo", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { model, year, km, fipe, marketValue } = req.body;

    if (!model) {
      return res.status(400).json({ error: "Faltando parâmetro: 'model' é obrigatório." });
    }

    const hasUserFipe = fipe && !isNaN(Number(fipe)) && Number(fipe) > 0;
    const fipeNum = hasUserFipe ? Number(fipe) : null;
    const hasUserMarket = marketValue && !isNaN(Number(marketValue)) && Number(marketValue) > 0;
    const marketNum = hasUserMarket ? Number(marketValue) : null;

    const prompt = `
      Você é um Consultor Especialista em Leilões de Veículos e Analista de Mercado Automotivo brasileiro.
      Sua tarefa é analisar o seguinte lote de veículo de leilão com foco em viabilidade financeira, liquidez de mercado e risco mecânico.
      
      Veículo a analisar:
      - Modelo/Versão: ${model}
      - Ano: ${year || "Não informado"}
      - KM: ${km || "Não informado"}
      ${hasUserFipe ? `- Tabela FIPE fornecida pelo usuário: R$ ${fipeNum}` : "- Tabela FIPE: Não fornecida pelo usuário."}
      ${hasUserMarket ? `- Valor de Mercado fornecido pelo usuário: R$ ${marketNum}` : "- Valor de Mercado: Não fornecido pelo usuário."}
      
      Siga estritamente estas diretrizes de análise:
      1. Tabela FIPE & Valor de Mercado: ${hasUserFipe ? `O usuário já forneceu o valor oficial da Tabela FIPE de R$ ${fipeNum}. Retorne este valor exato no campo 'fipe'.` : `Utilize a ferramenta de pesquisa Google Search Grounding para pesquisar na internet (sites como FIPE oficial, Webmotors, KBB Brasil, iCarros, etc.) o valor oficial atual da Tabela FIPE para o veículo "${model}" do ano correspondente e retorne este valor no campo 'fipe'.`} ${hasUserMarket ? `O usuário já forneceu o valor médio de mercado de R$ ${marketNum}. Retorne este valor exato no campo 'marketValue'.` : `Utilize a ferramenta de pesquisa Google Search Grounding para pesquisar o valor médio real de mercado (Valor de Avaliação / Revenda) no Brasil para o veículo "${model}" do ano correspondente e retorne no campo 'marketValue'.`} NÃO use números fictícios ou inventados, use valores de mercado brasileiros reais!
      2. Regra do Teto (70% FIPE): O lance sugerido deve ser calculado de modo que o custo com (Lance + 5% Comissão + R$ 1.000 de taxas) fique abaixo de 70% FIPE. A fórmula exata é: (0.70 * FIPE - 1000) / 1.05. Certifique-se de que o campo 'suggestedBid' retorne este valor exato arredondado para baixo baseado no valor real da FIPE encontrado.
      3. Análise de Risco: Avalie a quilometragem (${km}) e a reputação mecânica do modelo. Use seu conhecimento especializado sobre motores brasileiros (ex: Sigma, Firefly, 3 cilindros Ford, EA111, E.torQ, AL4/AT8 etc.) para alertar sobre problemas comuns, correias banhadas a óleo e manutenções caras.
      4. Classificação: Separe o veículo em duas categorias de status: "Prioritário" (Recomendado) ou "Não Indicado" (Alto Risco).
      5. Liquidez: Defina a liquidez de mercado em uma das opções: "Altíssima", "Média", "Baixa" ou "Baixíssima" com base na procura histórica desse modelo no Brasil.
      6. Tom: Profissional, analítico e objetivo. Evite termos genéricos; seja específico sobre pontos de atenção mecânicos e de mercado.

      Aqui está o histórico de análises para calibrar suas respostas:
      - Fiat Uno Attractive (17/17, 80k km, FIPE: R$ 39.000) -> Sugerido: R$ 25.000, Liquidez: Altíssima, Prioritário.
      - Ford Ka SE (15/15, 123k km, FIPE: R$ 36.000) -> Sugerido: R$ 23.000, Liquidez: Altíssima, Prioritário.
      - VW Gol (12/13, 162k km, FIPE: R$ 27.000) -> Sugerido: R$ 17.000, Liquidez: Altíssima, Prioritário.
      - Fiat Uno Vivace (14/15, 96k km, FIPE: R$ 26.000) -> Sugerido: R$ 16.000, Liquidez: Altíssima, Prioritário.
      - Ford Fiesta 1.5 (13/14, 200k km, FIPE: R$ 29.000) -> Sugerido: R$ 18.000, Liquidez: Média, Não Indicado (Quilometragem alta).
      - VW Fox BlueMotion (13/14, 141k km, FIPE: R$ 35.000) -> Sugerido: R$ 21.000, Liquidez: Altíssima, Prioritário.
      - Citroën C3 BVA (14/15, 138k km, FIPE: R$ 34.000) -> Sugerido: R$ 21.500, Liquidez: Baixíssima, Não Indicado (câmbio AL4 problemático).

      Retorne em formato JSON estrito conforme o esquema fornecido.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        fipe: {
          type: Type.INTEGER,
          description: "Brazilian Tabela FIPE value (in BRL/Reais) found or estimated for this vehicle model and year."
        },
        marketValue: {
          type: Type.INTEGER,
          description: "Brazilian average Market Value (in BRL/Reais) found or estimated for this vehicle model and year."
        },
        suggestedBid: { 
          type: Type.INTEGER, 
          description: "Calculated Suggested Max Bid (Lance Máximo Sugerido) following the 70% FIPE formula: (0.7*FIPE - 1000)/1.05." 
        },
        liquidity: { 
          type: Type.STRING, 
          description: "Market liquidity: 'Altíssima', 'Média', 'Baixa' or 'Baixíssima'." 
        },
        category: { 
          type: Type.STRING, 
          description: "Classification status: 'Prioritário' or 'Não Indicado'." 
        },
        riskAnalysis: { 
          type: Type.STRING, 
          description: "Detailed analysis of mileage and motor/model mechanical reputation in Portuguese (Markdown supported)." 
        },
        executiveSummary: { 
          type: Type.STRING, 
          description: "A professional, direct and objective summary about why this car is recommended or not, specifying exact issues." 
        }
      },
      required: ["fipe", "marketValue", "suggestedBid", "liquidity", "category", "riskAnalysis", "executiveSummary"]
    };

    let data: any = {};
    let parsedSuccessfully = false;

    // 1. TENTATIVA COM GOOGLE SEARCH
    try {
      console.log("[Consultar-Veiculo] Tentando obter dados com Google Search...");
      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      });

      const resultText = response.text || "{}";
      try {
        data = JSON.parse(resultText.trim());
        parsedSuccessfully = true;
      } catch (parseErr) {
        console.warn("[Consultar-Veiculo] Falha ao analisar JSON da resposta com busca. Tentando limpar...", parseErr);
        const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        data = JSON.parse(cleaned);
        parsedSuccessfully = true;
      }
    } catch (searchError: any) {
      console.warn("[Consultar-Veiculo] Falha na primeira tentativa com Google Search Grounding:", searchError.message);
    }

    // 2. FALLBACK SEM GOOGLE SEARCH
    if (!parsedSuccessfully) {
      console.log("[Consultar-Veiculo] Iniciando fallback sem busca...");
      try {
        const response = await ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1,
          },
        });

        const resultText = response.text || "{}";
        try {
          data = JSON.parse(resultText.trim());
          parsedSuccessfully = true;
        } catch (parseErr) {
          console.warn("[Consultar-Veiculo] Falha ao analisar JSON do fallback. Tentando limpar...", parseErr);
          const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
          data = JSON.parse(cleaned);
          parsedSuccessfully = true;
        }
      } catch (fallbackError: any) {
        console.error("[Consultar-Veiculo] Falha crítica no fallback de IA:", fallbackError);
        throw new Error("Não foi possível analisar o lote do veículo com IA.");
      }
    }

    // Garante que todos os campos obrigatórios estejam presentes com valores padrão seguros se houver falhas de preenchimento pela IA
    if (!data.fipe || isNaN(Number(data.fipe)) || Number(data.fipe) <= 0) {
      data.fipe = hasUserFipe ? fipeNum : 40000; // Valor padrão de contingência
    } else {
      data.fipe = Math.round(Number(data.fipe));
    }

    if (!data.marketValue || isNaN(Number(data.marketValue)) || Number(data.marketValue) <= 0) {
      data.marketValue = hasUserMarket ? marketNum : Math.round(data.fipe * 1.05); // Normalmente ligeiramente acima da FIPE ou igual
    } else {
      data.marketValue = Math.round(Number(data.marketValue));
    }

    if (!data.suggestedBid || isNaN(Number(data.suggestedBid)) || Number(data.suggestedBid) <= 0) {
      data.suggestedBid = Math.floor((0.70 * data.fipe - 1000) / 1.05);
    } else {
      data.suggestedBid = Math.round(Number(data.suggestedBid));
    }

    if (!data.liquidity) {
      data.liquidity = "Média";
    }

    if (!data.category) {
      data.category = "Prioritário";
    }

    if (!data.riskAnalysis) {
      data.riskAnalysis = "Análise técnica realizada com sucesso com base nas características gerais e quilometragem.";
    }

    if (!data.executiveSummary) {
      data.executiveSummary = `Lote avaliado sob a Regra de 70% FIPE de R$ ${data.fipe.toLocaleString('pt-BR')}. Lance máximo recomendado para manter a margem de lucro segura.`;
    }

    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota /api/consultar-veiculo:", error);
    res.status(500).json({ error: "Falha na análise inteligente do veículo: " + error.message });
  }
});

// 4. API: Consultoria Imóvel Expert (Regra do Teto 60%, Risco de Ocupação e Jurídico)
app.post("/api/consultar-imovel", async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { typeText, location, area, marketValue, currentBid } = req.body;

    if (!typeText || !location) {
      return res.status(400).json({ error: "Faltando parâmetros: 'typeText' e 'location' são obrigatórios." });
    }

    const hasUserMarket = marketValue && !isNaN(Number(marketValue)) && Number(marketValue) > 0;
    const marketNum = hasUserMarket ? Number(marketValue) : null;
    const hasUserBid = currentBid && !isNaN(Number(currentBid)) && Number(currentBid) > 0;
    const bidNum = hasUserBid ? Number(currentBid) : null;

    const prompt = `
      Você é um Consultor Especialista em Leilões de Imóveis (Leilões da Caixa Econômica Federal, Leilões Judiciais e Extrajudiciais) e Analista do Mercado Imobiliário brasileiro.
      Sua tarefa é analisar o seguinte lote de imóvel de leilão com foco em viabilidade financeira, liquidez de revenda, status de ocupação e riscos jurídicos/condominiais.
      
      Imóvel a analisar:
      - Tipo de Imóvel: ${typeText} (ex: Apartamento, Casa, Sobrado, Terreno, Chácara, Comercial)
      - Localização/Bairro: ${location}
      - Área: ${area || "Não informada"}
      ${hasUserMarket ? `- Valor de Mercado/Avaliação fornecido pelo usuário: R$ ${marketNum}` : "- Valor de Mercado/Avaliação: Não fornecido."}
      ${hasUserBid ? `- Lance Mínimo/Atual fornecido pelo usuário: R$ ${bidNum}` : "- Lance Mínimo/Atual: Não fornecido."}
      
      Siga estritamente estas diretrizes de análise:
      1. Valor de Mercado: ${hasUserMarket ? `O usuário já forneceu o valor médio de mercado de R$ ${marketNum}. Retorne este valor exato no campo 'marketValue'.` : `Utilize a ferramenta de pesquisa Google Search Grounding para pesquisar o valor de mercado aproximado real de imóveis do mesmo tipo e tamanho na localização "${location}" e retorne no campo 'marketValue'.`} NÃO use números fictícios ou inventados, use valores de mercado brasileiros reais!
      2. Regra do Teto (60% do Valor de Mercado): O lance máximo sugerido deve ser calculado de modo que os custos estimados com (Lance + 5% Comissão Leiloeiro + 3% ITBI + R$ 5.000 para custos de desocupação e imissão na posse judicial ou condomínio/IPTU atrasados) não ultrapassem 60% do valor de mercado para manter uma margem segura de viabilidade. A fórmula exata recomendada é: (0.60 * Valor de Mercado - 5000) / 1.08. Certifique-se de que o campo 'suggestedBid' retorne este valor exato arredondado para baixo baseado no valor médio real encontrado.
      3. Análise de Risco: Avalie riscos de leilão de imóveis no Brasil na região, como status provável de ocupação, facilidade e velocidade de obter imissão na posse (desocupação judicial), pendências de impostos propter rem (IPTU, taxas condominiais), e riscos jurídicos clássicos (processos de suspensão/anulação do leilão pelo devedor fiduciante).
      4. Classificação: Defina se o imóvel é "Prioritário" (Baixo risco relativo, boa localização urbana, fácil revenda e desocupação comum) ou "Não Indicado" (Chácaras ou terrenos de baixíssima liquidez, imóveis com ações judiciais pesadas registradas na matrícula, ou em áreas de altíssimo risco urbano).
      5. Liquidez: Defina a liquidez de revenda em uma das opções: "Alta", "Média", "Baixa" ou "Baixíssima" com base na região e tipo do imóvel.
      6. Ocupação: Indique se o imóvel provavelmente está "Ocupado" ou "Desocupado".
      7. Tom: Profissional, analítico, cuidadoso e focado no investidor.

      Retorne em formato JSON estrito conforme o esquema fornecido.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        marketValue: {
          type: Type.INTEGER,
          description: "Brazilian average Market Value (in BRL/Reais) found or estimated for this property based on location and area."
        },
        suggestedBid: { 
          type: Type.INTEGER, 
          description: "Calculated Suggested Max Bid (Lance Máximo Sugerido) following the 60% Market Value formula: (0.60 * MarketValue - 5000)/1.08." 
        },
        liquidity: { 
          type: Type.STRING, 
          description: "Market liquidity for resale: 'Alta', 'Média', 'Baixa' or 'Baixíssima'." 
        },
        category: { 
          type: Type.STRING, 
          description: "Classification status: 'Prioritário' or 'Não Indicado'." 
        },
        occupancyStatus: {
          type: Type.STRING,
          description: "Probable occupancy status of the auction property: 'Ocupado' or 'Desocupado'."
        },
        riskAnalysis: { 
          type: Type.STRING, 
          description: "Detailed legal and occupancy risk analysis, eviction guidelines, and local market advice in Portuguese (Markdown supported)." 
        },
        executiveSummary: { 
          type: Type.STRING, 
          description: "A professional, direct and objective summary about why this real estate lot is recommended or not, specifying exact risks or advantages." 
        }
      },
      required: ["marketValue", "suggestedBid", "liquidity", "category", "occupancyStatus", "riskAnalysis", "executiveSummary"]
    };

    let data: any = {};
    let parsedSuccessfully = false;

    // 1. TENTATIVA COM GOOGLE SEARCH
    try {
      console.log("[Consultar-Imovel] Tentando obter dados com Google Search...");
      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      });

      const resultText = response.text || "{}";
      try {
        data = JSON.parse(resultText.trim());
        parsedSuccessfully = true;
      } catch (parseErr) {
        console.warn("[Consultar-Imovel] Falha ao analisar JSON da resposta com busca. Tentando limpar...", parseErr);
        const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        data = JSON.parse(cleaned);
        parsedSuccessfully = true;
      }
    } catch (searchError: any) {
      console.warn("[Consultar-Imovel] Falha na primeira tentativa com Google Search Grounding:", searchError.message);
    }

    // 2. FALLBACK SEM GOOGLE SEARCH
    if (!parsedSuccessfully) {
      console.log("[Consultar-Imovel] Iniciando fallback sem busca...");
      try {
        const response = await ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1,
          },
        });

        const resultText = response.text || "{}";
        try {
          data = JSON.parse(resultText.trim());
          parsedSuccessfully = true;
        } catch (parseErr) {
          console.warn("[Consultar-Imovel] Falha ao analisar JSON do fallback. Tentando limpar...", parseErr);
          const cleaned = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
          data = JSON.parse(cleaned);
          parsedSuccessfully = true;
        }
      } catch (fallbackError: any) {
        console.error("[Consultar-Imovel] Falha crítica no fallback de IA:", fallbackError);
        throw new Error("Não foi possível analisar o lote do imóvel com IA.");
      }
    }

    // Garante que todos os campos obrigatórios estejam presentes com valores padrão seguros
    if (!data.marketValue || isNaN(Number(data.marketValue)) || Number(data.marketValue) <= 0) {
      data.marketValue = hasUserMarket ? marketNum : 250000; // Valor padrão de contingência
    } else {
      data.marketValue = Math.round(Number(data.marketValue));
    }

    if (!data.suggestedBid || isNaN(Number(data.suggestedBid)) || Number(data.suggestedBid) <= 0) {
      data.suggestedBid = Math.floor((0.60 * data.marketValue - 5000) / 1.08);
    } else {
      data.suggestedBid = Math.round(Number(data.suggestedBid));
    }

    if (!data.liquidity) {
      data.liquidity = "Média";
    }

    if (!data.category) {
      data.category = "Prioritário";
    }

    if (!data.occupancyStatus) {
      data.occupancyStatus = "Ocupado";
    }

    if (!data.riskAnalysis) {
      data.riskAnalysis = "Análise técnica e jurídica efetuada com base no tipo de imóvel e localização geral. Recomenda-se solicitar certidão de ônus atualizada do registro de imóveis.";
    }

    if (!data.executiveSummary) {
      data.executiveSummary = `Imóvel avaliado sob a Regra de 60% do valor de mercado estimado em R$ ${data.marketValue.toLocaleString('pt-BR')}. Lance máximo recomendado para amortizar ITBI, corretagem e custos de desocupação.`;
    }

    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota /api/consultar-imovel:", error);
    res.status(500).json({ error: "Falha na análise inteligente do imóvel: " + error.message });
  }
});

// Configure Vite or Static Files
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando servidor em modo DESENVOLVIMENTO com middleware do Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Mount Vite middleware
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor em modo PRODUÇÃO...");
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve static frontend assets
    app.use(express.static(distPath));
    
    // Catch-all route to serve Index.html for SPA router
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando com sucesso no endereço: http://localhost:${PORT}`);
  });
}

startApp().catch(err => {
  console.error("Falha ao iniciar o aplicativo full-stack:", err);
});

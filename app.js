// --- ÍNDICE DA BASE DE DADOS ---
// Agora, este objeto contém apenas os caminhos para os arquivos JSON,
// e não mais os dados completos.
const database = {
    "Direito Penal": {
        "Crimes contra a Vida": {
            // CORRIGIDO: O caminho agora aponta para a raiz do projeto,
            // de acordo com a sua estrutura de arquivos do GitHub.
            "Visão Geral": "crimes-contra-a-vida.json" 
        }
    }
};

// --- INICIALIZAÇÃO ---
// 'DOMContentLoaded' garante que o script JS execute após o HTML estar pronto.
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    // Inicializa os ícones do Lucide (Top-bar e Sidebar)
    // Ícones do Mapa Mental são inicializados após o fetch.
    lucide.createIcons();
});

// --- FUNÇÕES DE UI (MENU) ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// --- FUNÇÕES DA SIDEBAR ---
function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = ''; // Limpa a navegação

    for (const disciplina in database) {
        // Nível 1: Disciplina
        const discContainer = document.createElement('div');
        discContainer.className = 'mb-4';
        
        const discButton = document.createElement('button');
        discButton.className = 'flex items-center justify-between w-full text-lg font-semibold text-left text-blue-300 hover:text-white focus:outline-none py-2';
        discButton.innerHTML = `
            <span>${disciplina}</span>
            <i data-lucide="chevron-down" class="w-5 h-5 transition-transform duration-200"></i>
        `;
        
        const temasList = document.createElement('ul');
        temasList.className = 'ml-4 mt-2 hidden space-y-2 border-l border-gray-700'; // Começa escondido

        for (const tema in database[disciplina]) {
            // Nível 2: Tema
            const temaItem = document.createElement('li');
            temaItem.className = "pl-4";
            
            const temaButton = document.createElement('button');
            temaButton.className = 'flex items-center justify-between w-full text-md font-medium text-left text-gray-300 hover:text-white focus:outline-none py-1';
            temaButton.innerHTML = `
                <span>${tema}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 transition-transform duration-200"></i>
            `;
            
            const subtemasList = document.createElement('ul');
            subtemasList.className = 'ml-4 mt-2 hidden space-y-1 border-l border-gray-600'; // Começa escondido

            for (const subtema in database[disciplina][tema]) {
                // Nível 3: Subtema
                const subtemaItem = document.createElement('li');
                subtemaItem.className = "pl-4";

                const subtemaLink = document.createElement('a');
                subtemaLink.href = '#';
                subtemaLink.textContent = subtema;
                subtemaLink.className = 'block text-gray-400 hover:text-white py-1 transition-colors';
                
                // Armazena os dados necessários para o clique
                subtemaLink.dataset.disciplina = disciplina;
                subtemaLink.dataset.tema = tema;
                subtemaLink.dataset.subtema = subtema;
                // Armazena o caminho do JSON
                subtemaLink.dataset.path = database[disciplina][tema][subtema];

                // *** MUDANÇA PRINCIPAL ***
                // O clique agora chama a função de carregamento
                subtemaLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove o 'active' de todos os links
                    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('text-white', 'font-bold'));
                    // Adiciona o 'active' no link clicado
                    e.target.classList.add('text-white', 'font-bold');

                    const path = e.target.dataset.path;
                    const title = e.target.dataset.subtema;
                    
                    loadAndRenderMindMap(path, title);
                    
                    // Fecha o menu se estiver no modo mobile
                    if (window.innerWidth < 768) { // 768px é o breakpoint 'md' do Tailwind
                        toggleMenu();
                    }
                });
                
                subtemaItem.appendChild(subtemaLink);
                subtemasList.appendChild(subtemaItem);
            }

            temaButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que o clique feche a disciplina
                subtemasList.classList.toggle('hidden');
                temaButton.querySelector('i').classList.toggle('rotate-180');
            });

            temaItem.appendChild(temaButton);
            temaItem.appendChild(subtemasList);
            temasList.appendChild(temaItem);
        }

        discButton.addEventListener('click', () => {
            temasList.classList.toggle('hidden');
            discButton.querySelector('i').classList.toggle('rotate-180');
        });
        
        discContainer.appendChild(discButton);
        discContainer.appendChild(temasList);
        nav.appendChild(discContainer);
    }
    lucide.createIcons(); // Cria os ícones do acordeão
}

// --- FUNÇÕES DO MAPA MENTAL ---

/**
 * NOVA FUNÇÃO: Carrega o JSON e então chama a renderização
 * @param {string} jsonPath - O caminho para o arquivo .json
 * @param {string} title - O título para exibir no H2
 */
async function loadAndRenderMindMap(jsonPath, title) {
    const container = document.getElementById('mindmap-container');
    const titleEl = document.getElementById('content-title');
    
    titleEl.textContent = title;
    // Mostra um indicador de carregamento
    container.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const mapData = await response.json();
        
        // Sucesso: renderiza o mapa
        renderMindMap(mapData, title);

    } catch (error) {
        console.error("Falha ao carregar o mapa mental:", error);
        // Mostra uma mensagem de erro para o usuário
        container.innerHTML = `<p class="text-red-500">Não foi possível carregar o mapa mental. Verifique o console para mais detalhes.</p>`;
    }
}


/**
 * Renderiza a estrutura do mapa mental no DOM
 * @param {object} mapData - Os dados do mapa (vindos do JSON)
 * @param {string} title - O título do subtema
 */
function renderMindMap(mapData, title) {
    const container = document.getElementById('mindmap-container');
    const titleEl = document.getElementById('content-title');
    
    titleEl.textContent = title;
    container.innerHTML = ''; // Limpa o loader

    if (mapData && mapData.title) {
        // Cria o nó raiz (nível 0)
        const rootNode = createMindMapNode(mapData, true); // true = isRoot
        container.appendChild(rootNode);
    } else {
        container.innerHTML = '<p class="text-gray-500">Dados do mapa mental estão em formato inválido.</p>';
    }
    
    // Recria os ícones do Lucide APÓS adicionar os elementos ao DOM
    lucide.createIcons();
}

/**
 * Cria recursivamente os nós do mapa mental
 * @param {object} nodeData - Os dados do nó atual
 * @param {boolean} isRoot - Se este é o nó raiz
 */
function createMindMapNode(nodeData, isRoot = false) {
    const node = document.createElement('div');
    const hasChildren = nodeData.children && nodeData.children.length > 0;
    
    node.className = isRoot ? 'mindmap-root' : 'mindmap-node';
    if (!hasChildren && !isRoot) {
        node.classList.add('no-children');
    }

    // O Card do Tópico
    const card = document.createElement('div');
    card.className = 'mindmap-card';
    
    // Conteúdo Esquerdo (Ícone + Texto)
    const leftContent = document.createElement('div');
    leftContent.className = 'flex items-center min-w-0'; // min-w-0 para truncar texto
    
    const icon = document.createElement('i');
    // Ícone de "livro" para o raiz, "arquivo" para os filhos
    icon.setAttribute('data-lucide', isRoot ? 'book-open' : 'file-text');
    icon.className = 'w-5 h-5 text-blue-500 mr-3 flex-shrink-0';
    
    const text = document.createElement('span');
    text.textContent = nodeData.title;
    text.className = (isRoot ? 'text-xl font-semibold text-gray-800' : 'text-lg text-gray-700') + ' truncate';
    
    leftContent.appendChild(icon);
    leftContent.appendChild(text);

    // Conteúdo Direito (Botão Google IA)
    const searchButton = document.createElement('button');
    searchButton.className = 'ml-4 text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 flex-shrink-0';
    searchButton.title = `Pesquisar "${nodeData.title}" no Google (Modo IA)`;
    // Ícone "BrainCircuit" para IA
    searchButton.innerHTML = '<i data-lucide="brain-circuit" class="w-5 h-5"></i>';
    searchButton.onclick = () => searchOnGoogle(nodeData.title);
    
    card.appendChild(leftContent);
    card.appendChild(searchButton);
    node.appendChild(card);

    // Processa os filhos recursivamente
    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'mindmap-children';
        
        nodeData.children.forEach(childData => {
            const childNode = createMindMapNode(childData, false);
            childrenContainer.appendChild(childNode);
        });
        
        node.appendChild(childrenContainer);
    }
    
    return node;
}

// --- FUNÇÕES AUXILIARES ---
function searchOnGoogle(topic) {
    // Codifica o tópico para ser usado em uma URL
    const query = encodeURIComponent(topic);
    // O "modo IA" do Google (AI Overviews) é ativado automaticamente
    // pela pesquisa padrão.
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank');
}


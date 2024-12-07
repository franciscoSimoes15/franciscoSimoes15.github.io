function showNotification(riskLevel) {
    const notification = document.getElementById("notification");
    const message = document.getElementById("notification-message");

    // Exibir notificação somente para risco alto
    if (riskLevel === "Alto") {
        // Atualiza apenas o texto da mensagem, sem apagar o botão
        message.innerHTML = `<i class="fas fa-fire"></i> Risco de Incêndio Alto! Aja imediatamente!`;
        notification.className = "notification high"; // Classe para risco alto

        // Exibe a notificação
        notification.style.display = 'block';
        notification.style.opacity = 1;

        // Configura a remoção automática, mas permite que o usuário feche manualmente
        setTimeout(function() {
            // Apenas esconde se o usuário não fechou manualmente
            if (notification.style.opacity !== '0') {
                notification.style.opacity = 0;
                setTimeout(function() {
                    notification.style.display = 'none';
                }, 500); // Tempo para esconder completamente
            }
        }, 5000); // A notificação ficará visível por 5 segundos
    } else {
        // Caso contrário, não exibir nada
        notification.style.display = 'none';
    }
}




// Inicializar o mapa centrado em Coimbra, focando em uma área mais próxima das florestas
const map = L.map('map', {
    center: [40.2110, -8.4290], // Coordenadas de Coimbra
    zoom: 14,                    // Nível de zoom inicial
    zoomControl: false     // Desabilitar o zoom pelo scroll
});

// Adicionar camada de tiles do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Definir limites de Coimbra
const coimbraBounds = [
    [40.1816, -8.4883], // Limite inferior esquerdo (latitude, longitude)
    [40.2411, -8.3248]  // Limite superior direito (latitude, longitude)
];

// Limitar o movimento do mapa dentro desses limites
map.setMaxBounds(coimbraBounds);
map.on('drag', function() {
    map.panInsideBounds(coimbraBounds);
});

// GeoJSON representando as áreas florestais em Coimbra
const forestAreas = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Mata Nacional do Choupal" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-8.469432, 40.219255],
                    [-8.459581, 40.220632],
                    [-8.446771, 40.219190],  
                    [-8.439435, 40.216141], 
                    [-8.442738, 40.223531],  
                    [-8.454604, 40.224284],  
                    [-8.465784, 40.223285],   
                    [-8.469432, 40.219255]  // Fechar polígono
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Mata Nacional de Vale de Canas" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-8.376808, 40.213045],
                    [-8.375930, 40.208736],
                    [-8.367680, 40.207932],
                    [-8.366115, 40.211291],
                    [-8.370566, 40.214029],
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Floresta da Escola Superior Agrária de Coimbra" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-8.448616, 40.213898],
                    [-8.447125, 40.213992],
                    [-8.446772, 40.212905],
                    [-8.448980, 40.209273],
                    [-8.450601, 40.210997],
                    [-8.448616, 40.213898]  // Fechar polígono
                ]]
            }
        }
    ]
};

// Função para calcular o risco de incêndio com base na fórmula: Risco = Temperatura / Humidade
function calculateFireRisk(temperature, humidity) {
    const riskScore = temperature / humidity;  // Fórmula simplificada para risco
    let riskLevel = "Baixo";  // Define o nível de risco por padrão

    // Classificação do risco com base no valor calculado
    if (riskScore >= 0.7) {
        riskLevel = "Alto"; // Risco alto
    } else if (riskScore >= 0.3 && riskScore < 0.7) {
        riskLevel = "Médio"; // Risco médio
    } else {
        riskLevel = "Baixo"; // Risco baixo
    }

    return { riskLevel, riskScore };
}

// Cores associadas ao risco
const colorCycle = {
    "Baixo": "green",   // Risco baixo - verde
    "Médio": "yellow",  // Risco médio - amarelo
    "Alto": "red"       // Risco alto - vermelho
};

// Função para gerar valores aleatórios para condições climáticas
function generateRandomConditions() {
    const temperature = Math.floor(Math.random() * (40 - 10 + 1)) + 10; // Temperatura entre 10°C e 40°C
    const humidity = Math.floor(Math.random() * (80 - 20 + 1)) + 20;   // Humidade entre 20% e 80%
    const windSpeed = (Math.random() * (50 - 5) + 5).toFixed(1);       // Velocidade do vento entre 5 e 50 km/h

    return { temperature, humidity, windSpeed };
}

// Definir a camada GeoJSON globalmente para permitir o uso em diferentes funções
let geoJsonLayer = L.geoJSON(forestAreas, {
    style: function(feature) {
        // Gera condições aleatórias para cada área florestal
        const { temperature, humidity } = generateRandomConditions();
        const { riskLevel } = calculateFireRisk(temperature, humidity);
        const color = colorCycle[riskLevel];

        // Verifica o nível de risco e exibe a notificação
        showNotification(riskLevel);

        return {
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.5
        };
    },
    onEachFeature: function(feature, layer) {
        // Gera condições aleatórias para cada área florestal
        const { temperature, humidity, windSpeed } = generateRandomConditions();
        const { riskLevel, riskScore } = calculateFireRisk(temperature, humidity);

        layer.bindPopup(`    
            <b>Área Florestal:</b> ${feature.properties.name}<br>
            <b>Temperatura:</b> ${temperature}°C<br>
            <b>Humidade:</b> ${humidity}%<br>
            <b>Velocidade do Vento:</b> ${windSpeed} km/h<br>
            <b>Risco de Incêndio:</b> ${riskLevel} (${riskScore.toFixed(2)})<br>
        `);
    }
}).addTo(map);

// Função para alterar a cor dos polígonos com base no risco e nas condições meteorológicas
function changePolygonColor() {
    let showGlobalNotification = false; // Flag para exibir notificação global

    // Atualizar o estilo de cada polígono na camada existente com condições aleatórias
    geoJsonLayer.eachLayer(function(layer) {
        const { temperature, humidity, windSpeed } = generateRandomConditions();
        const { riskLevel, riskScore } = calculateFireRisk(temperature, humidity);
        const color = colorCycle[riskLevel];

        // Se algum polígono tiver risco alto, ativa a flag para notificação
        if (riskLevel === "Alto") {
            showGlobalNotification = true;
        }

        layer.setStyle({
            color: color,
            fillColor: color
        });

        // Atualizar o conteúdo do popup com as novas condições
        const popupContent = `  
            <b>Área Florestal:</b> ${layer.feature.properties.name}<br>
            <b>Temperatura:</b> ${temperature}°C<br>
            <b>Humidade:</b> ${humidity}%<br>
            <b>Velocidade do Vento:</b> ${windSpeed} km/h<br>
            <b>Risco de Incêndio:</b> ${riskLevel} (${riskScore.toFixed(2)})<br>
        `;
        layer.setPopupContent(popupContent);
    });

    // Exibir notificação apenas se o risco for alto em algum polígono
    if (showGlobalNotification) {
        showNotification("Alto");
    }
}

// Alterar a cor dos polígonos a cada 10 segundos
setInterval(changePolygonColor, 30000); // Altera a cor a cada 10 segundos

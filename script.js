
const apiDomain = "https://betterbluesky.nemtudo.me"; //production
// const apiDomain = "http://localhost:3692"; //dev
let trendsUpdatesCounts = 0;

const sessionID = `${Date.now()}_${randomString(10)}` //gera um ID para fins de uso no backend
console.log(`[BetterBluesky] SessionID: ${sessionID}`)

let betterblueskystorage = JSON.parse(localStorage.getItem("BETTERBLUESKY")) || {};
window.betterblueskystorage = betterblueskystorage;

function loadBetterbluesky() {

    const defaultConfig = { loaded: true, trendingTopics: true, telemetry: true, videos: true, likes: true, polls: true, easter_egg_tremdetopicos: false };

    if (!localStorage.getItem("BETTERBLUESKY")) {
        localStorage.setItem("BETTERBLUESKY", JSON.stringify(defaultConfig));
        alert("Seja muito bem-vindo ao BetterBluesky! Ajude mais pessoas a conhecerem o nosso trabalho curtindo e repostando o post de onde você nos conheceu! Siga @nemtudo.me para atualizações <3")
    }

    if (localStorage.getItem("BETTERBLUESKY") === '{loaded: true}') localStorage.setItem("BETTERBLUESKY", JSON.stringify(defaultConfig)); //convert old version to new

    const storage = JSON.parse(localStorage.getItem("BETTERBLUESKY"));
    betterblueskystorage = storage;

    //REGISTER USER - NO CONFIDENTIAL INFORMATION IS COLLECTED
    //Why is this data collected? 
    //I plan to add future updates about users, such as trending topics based on location.
    //In addition to, of course, preventing spam users and bad actors
    //It is worth remembering that no confidential data is collected.

    //Handle is public to everyone.
    //did is the user ID, which is also public.
    //What SessionID? SessionID is an ID generated by BetterBluesky whenever it is loaded. Its usefulness is for internal statistical purposes, such as estimating the number of online users.

    //Furthermore, it is worth remembering that the entire extension (backend and frontend) are open source and can be revised whenever necessary! :)   
    const blueskyStorage = JSON.parse(localStorage.getItem("BSKY_STORAGE"));
    fetch(`${apiDomain}/api/stats/users?sessionID=${sessionID}&handle=${blueskyStorage.session.currentAccount.handle}&did=${blueskyStorage.session.currentAccount.did}`, {
        method: "POST",
    }).then(() => {
        replaceBetterBlueSkyVideos()
        replaceBetterBlueSkyPolls()
        setTimeout(() => {
            replaceBetterBlueSkyVideos()
        }, 1000)
    })
}

function setFavicon() {
    document.querySelectorAll('link[rel*="icon"]').forEach(element => {
        element.href = "https://nemtudo.me/cdn/betterblueskylogo.png";
    })
}

function updateCheckBoxes() {
    // Check the checkboxes if their value is true in localStorage
    // try & catch to avoid crashes
    try {
        document.querySelectorAll('[type="checkbox"]').forEach(item => {
            // We check if item is undefined so when a user upgrades to this version, its set to true
            if (betterblueskystorage[item.name] == true || betterblueskystorage[item.name] == undefined) {
                item.checked = true;
            }
        });
    } catch (error) {
        console.warn(error);
    }
}

function updatePreferences(preference, value) {
    function updateStorage() {
        betterblueskystorage = JSON.parse(localStorage.getItem("BETTERBLUESKY"));
    }

    const object = JSON.parse(localStorage.getItem("BETTERBLUESKY"));
    
    if(typeof value != "undefined"){
        object[preference] = value;
    } else {
        object[preference] = !object[preference];
    }
    
    localStorage.setItem("BETTERBLUESKY", JSON.stringify(object));

    updateStorage();
}

async function getTrends(count) {
    if (betterblueskystorage.trendingTopics == false) return; // No unnecessary requests 
    const trends = await fetch(`${apiDomain}/api/trends?updateCount=${count}&sessionID=${sessionID}`).then(r => r.json());
    return trends.data;
}

async function updateTrends(replaceAll = false) {
    if (betterblueskystorage.trendingTopics == false) return; // Avoid updating trends when they are disabled.
    console.log("[BetterBluesky] Trends Atualizado", trendsUpdatesCounts)
    const trends = await getTrends(trendsUpdatesCounts);
    trendsUpdatesCounts++;

    let html = "";

    for (const trend in trends) {
        html += `<li><a class="trend_item" trend_data='{"text": "${encodeURIComponent(trends[trend].text)}", "position": ${trend}, "count": ${trends[trend].count}}' href='${`https://bsky.app/search?q=${encodeURIComponent(trends[trend].text)}`}'><span class="counter">${Number(trend) + 1}</span>
                <div class="content"><span class="trend">${escapeHTML(trends[trend].text)}</span>${`${trends[trend].message ? `<span class="trendmessage">${trends[trend].count ? `<span class="trendcount">${formatNumber(trends[trend].count)} posts</span>` : ""}・${escapeHTML(trends[trend].message)}</span>` : (trends[trend].count ? `<span class="trendcount">${formatNumber(trends[trend].count)} posts</span>` : "")}`}</div></a>
            </li>`
    }

    html += `<span class="apoie">Gostou? Apoie o projeto! <a id="apoieurl" target="_blank" href='https://livepix.gg/nemtudo'>livepix.gg/nemtudo</a></span>`
    html += `<span class="sourcecode">Código fonte: <a id="sourcecode" target="_blank" href='https://bsky.app/profile/nemtudo.me/post/3l3dwh7m4bj27'>acessar</a></span>`

    if (document.querySelector("#trendsarea")) replaceAll ? document.querySelector("#trendsarea").innerHTML = html : document.querySelector("#trendsarea").innerHTML += html;
}

function settingsPopup() {
    document.body.innerHTML += `
                  <div id="popup-overlay" class="overlay">
                    <div class="pugpup">
                        <p class="preference-text">Trending Topics</p>
                        <input type="checkbox" id="preferences" class="pugbox" name="trendingTopics" />
                        
                        <p class="preference-text">Vídeos</p>
                        <input type="checkbox" id="preferences" class="pugbox" name="videos" />

                        <p class="preference-text">User Likes</p>
                        <input type="checkbox" id="preferences" class="pugbox" name="likes" />

                        <p class="preference-text">Enquetes</p>
                        <input type="checkbox" id="preferences" class="pugbox" name="polls" />

                        <button id="refresh-btn" class="refresh-page">Refresh ✨</button>
                    </div>
                </div>
            `
}

setInterval(() => {
    updateTrends(true);
}, 1000 * 30)


setInterval(() => {
    if (betterblueskystorage.videos == true) {
        replaceBetterBlueSkyVideos();
    }
}, 1000)
//eventos

window.addEventListener('load', () => setTimeout(() => { loadBetterbluesky(); setFavicon() }, 3000));
window.addEventListener('load', setFavicon);
window.addEventListener('load', () => setTimeout(() => { addSettingsButton(); }, 2000));
window.addEventListener('load', () => setTimeout(() => { addTrendsHTML(); }, 3200));

//atualizador de eventos
document.addEventListener('click', () => {
    addTrendsHTML();
    addVideoButton();
    addPollButton();
    setTimeout(() => {
        addLikedButton();
    }, 1000)
})

//eventos especificos 
document.addEventListener('click', (event) => {
    if (event.target.id === "betterblueskyvideobutton") {
        const url = getImgurVideoLink(prompt('[BetterBluesky] Insira o link do vídeo. Deve ser um link do imgur.com ou url direta'));
        if (!url) return;
        sendStats("createpost.videobutton.click", `{"url": "${url}"}`)
        document.querySelector('div[contenteditable="true"]').innerHTML += `&lt;BetterBlueSky_video:${escapeHTML(url)}&gt;`
    }

    if (event.target.id === "betterblueskypollbutton") {
        const title = prompt("[BetterBluesky] Qual o título da enquete?")
        if (!title) return;
        const options = [];
        const maxOptions = 5;

        addOption(0)
        function addOption(currentOptionNumber) {
            if (currentOptionNumber >= maxOptions) return createPoll({ title, options })
            const option = prompt(`[BetterBluesky] Qual a ${currentOptionNumber + 1}º opção? ${(currentOptionNumber != 0) ? "[Cancele para não adicionar mais]" : ""}`);
            if (!option) {
                if (currentOptionNumber === 0) return;
                return createPoll({ title, options })
            }
            options.push(option)
            addOption(currentOptionNumber + 1)
        }
    }

    if (event.target.classList.contains("betterbluesky_poll_option")) {
        const optionData = JSON.parse(event.target.getAttribute("betterbluesky_poll_option_data"));

        if (!optionData.voted) {
            votePoll(optionData.pollid, optionData.option)
        }
    }

    if (event.target.classList.contains("betterbluesky_setting")) {
        updateSetting(event.target.getAttribute("betterbluesky_update", e.target.checked))
    }

    if (event.target.id === "userlikedbutton") {
        sendStats("profile.likedbutton.click", JSON.stringify({ user: getViewingProfile() }))
        window.open(`https://likedbetterbluesky.nemtudo.me/?defaultHandle=${encodeURIComponent(getViewingProfile())}`)
    }

    if (event.target.id === "settings-btn") {
        settingsPopup();
        updateCheckBoxes();
    }

    if (event.target.id === "refresh-btn") {
        document.querySelector('.overlay').remove();
        location.reload();
    }

    if (event.target.id === "popup-overlay") {
        document.querySelector('.overlay').remove();
    }

    if (event.target.id === "preferences") {
        updatePreferences(event.target.name);
    }

    //stats

    if (event.target.classList.contains("trend_item")) {
        sendStats("trends.trend.click", event.target.getAttribute("trend_data"))
    }
    if (event.target.id === "apoieurl") {
        sendStats("trends.apoie.click", "{}")
    }
    if (event.target.id === "devcredits") {
        sendStats("trends.dev.click", "{}")
    }
})

//funções gerais

async function createPoll(poll) {
    const request = await fetch(`${apiDomain}/api/polls?polldata=${encodeURIComponent(JSON.stringify(poll))}&sessionID=${sessionID}`, {
        method: "POST",
    })

    const response = await request.json();

    if (request.status != 200) return alert(`Erro ao criar enquete: ${response.message}`);

    console.log(`[BetterBluesky] Enquete criada: ${response.id}`)

    document.querySelector('div[contenteditable="true"]').innerHTML += `https://nemtudo.me/betterbluesky/polls/${response.id}`

}

function addLikedButton() {
    if (betterblueskystorage.likes == false) return; // Respect user preference
    document.querySelectorAll('div[style="flex-direction: row; gap: 4px; align-items: center;"]').forEach(element => {
        if (element) {
            if (!element.querySelector('#userlikedbutton')) {
                element.innerHTML += `<button id="userlikedbutton">❤</button>`
            }
        }
    })
}

function sendStats(event, data) {
    if (betterblueskystorage.telemetry == false) return; // Respect user preference
    fetch(`${apiDomain}/api/stats?action=${event}&data=${encodeURIComponent(data)}&sessionID=${sessionID}`, { //"action" because "event" cause a bug
        method: "POST"
    })
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + ' mil';
    } else {
        return num.toString();
    }
}

function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addTrendsHTML() {
    if (betterblueskystorage.trendingTopics == false) return; // Respect user preference
    if (document.querySelector("#trendsarea")) return;

    const element = document.querySelector("div[class='css-175oi2r r-qklmqi r-5kkj8d r-le4sbl r-1444osr']") || document.querySelector('div[class="css-175oi2r r-196lrry r-pm9dpa r-1rnoaur r-1xcajam r-1ipicw7"]')

    if (element) element.innerHTML = `<div class="trends">
    <h2 id="trendingsname">${betterblueskystorage.easter_egg_tremdetopicos ? "Trem de tópicos" : "Trending Topics"} <span class='beta'>BETA</span></h2>
    <div class='description'>
    <span>Fornecido por <a style="color: #FF9325;" target="_blank" role="link" href='https://nemtudo.me/betterbluesky'>BetterBluesky</a>.<br> Desenvolvido por <a id="devcredits" target="_blank" href='https://bsky.app/profile/nemtudo.me'>@nemtudo.me</a>. Siga!</span>
    </div>
    <ul id="trendsarea">
    <span class="loadingtrends">Carregando...</span>
    </ul>
</div>` + element.innerHTML;
    updateTrends(true);
}

function addVideoButton() {
    if (betterblueskystorage.videos == false) return; // Respect user preference
    // dark
    if ((!document.querySelector("#betterblueskyvideobutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(0, 0, 0); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(0, 0, 0); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskyvideobutton'>Vídeo</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
    // menos dark
    if ((!document.querySelector("#betterblueskyvideobutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(255, 255, 255); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(255, 255, 255); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskyvideobutton'>Vídeo</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
    //claro
    if ((!document.querySelector("#betterblueskyvideobutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(22, 30, 39); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(22, 30, 39); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskyvideobutton'>Vídeo</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
}

function addPollButton() {
    if (betterblueskystorage.polls == false) return; // Respect user preference
    // dark
    if ((!document.querySelector("#betterblueskypollbutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(0, 0, 0); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(0, 0, 0); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskypollbutton'>Enquete</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
    // menos dark
    if ((!document.querySelector("#betterblueskypollbutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(255, 255, 255); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(255, 255, 255); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskypollbutton'>Enquete</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
    //claro
    if ((!document.querySelector("#betterblueskypollbutton")) && (document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(22, 30, 39); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]'))) document.querySelector('div[style="flex-direction: row; padding: 8px; background-color: rgb(22, 30, 39); border-top-width: 1px; border-color: rgba(0, 0, 0, 0);"]').innerHTML += `<button id='betterblueskypollbutton'>Enquete</button>` //+ document.querySelector("div[class='css-175oi2r r-1awozwy r-5kkj8d r-18u37iz r-cnw61z r-16lhzmz r-i023vh']").innerHTML;
}

function addSettingsButton() {
    // Settings / preferences by pugdev :D
    const sidebar = document.querySelector("div[class='css-175oi2r r-c4unlt r-pgf20v r-1rnoaur r-1xcajam r-1ki14p2 r-1w88a7h']") || document.querySelector("div[class='css-175oi2r r-pgf20v r-1rnoaur r-1xcajam r-1awozwy r-13l2t4g r-1pi2tsx r-1d2f490 r-12ijkx4 r-ipm5af r-z2g584']");
    if (sidebar) {
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "settings-btn";

        // Adds the settings button and an icon version for smaller screens.
        buttonContainer.innerHTML = `
            <button id='settings-btn' class='bb-settings-icon'>🦋</button> 
            <button id='settings-btn' class='bb-settings-button'><p id='settings-btn' class="bb-settings-text">🦋 BetterBluesky</p></button>
        `;

        var lastChild = sidebar.lastChild;

        sidebar.insertBefore(buttonContainer, lastChild);
    }
    if (!sidebar) console.warn("Nenhuma sidebar encontrada. o CSS mudou? 0_0");
}

function replaceBetterBlueSkyVideos() {
    if (betterblueskystorage.videos == false) return; // Respect user preference 
    // Seleciona todo o conteúdo da página
    const pageContents = document.querySelectorAll('div[data-testid="contentHider-post"],div[class="css-146c3p1 r-1xnzce8"]');

    // Regex para capturar o link no formato <betterblueskyvideo:link>
    const regex = /&lt;BetterBlueSky_video:(https?:\/\/[^\s>]+)&gt;/g;

    pageContents.forEach(element => {
        // Substitui pelo elemento de vídeo
        if (!element.innerHTML.match(regex)) return;
        const html = element.innerHTML.replace(regex, function (match, url) {
            if (!validURL(url)) return;
            const videoElement = `<video class="betterblueskyvideo" controls>
                    <source src="${escapeHTML(url)}" type="video/mp4">
                    Seu navegador não suporta tags de vídeos.
                </video>`;
            return videoElement;
        });

        // Atualiza o conteúdo da página
        element.innerHTML = html;
    })

}
async function replaceBetterBlueSkyPolls() {
    if (betterblueskystorage.polls == false) return; // Respect user preference
    // Seleciona todo o conteúdo da página
    const pageContents = document.querySelectorAll('div[class="css-146c3p1 r-1xnzce8"],div[data-testid="contentHider-post"]');

    // Regex para capturar o link no formato https://nemtudo.me/betterbluesky/polls/(id da poll a-zA-Z0-9)
    const regex = /<a\s+[^>]*href=["']https:\/\/nemtudo\.me\/betterbluesky\/polls\/([a-zA-Z0-9]+)["'][^>]*>(.*?)<\/a>/g;

    // Usando for...of para processar as substituições de forma assíncrona
    for (const element of pageContents) {
        let html = element.innerHTML;

        // Cria um array para armazenar as substituições
        const matches = [...html.matchAll(regex)];

        // Faz a substituição de cada match de forma assíncrona
        for (const match of matches) {
            const pollID = match[1];
            if (!element.innerHTML.match(regex)) return;
            console.log("ELEMENT", element)
            await replaceBetterBlueSkyPoll(pollID, [element], match[0])
        }

    }

    setTimeout(() => {
        replaceBetterBlueSkyPolls()
    }, 1000)
}

async function replaceBetterBlueSkyPoll(pollID, elements, match) {
    const poll = await getPoll(pollID);

    elements.forEach((element) => {
        let html = element.innerHTML;

        if (!poll) {
            const pollElement = `<div class="betterbluesky_pollnotfound"><span>Enquete excluída</span><span class="betterbluesky_pollnotfound_description"><a target="_blank" href="https://nemtudo.me/betterbluesky">BetterBluesky</a>・Veja os trendings topics, envie enquetes, vídeos & mais.</span></div>`;

            // Substitui o match atual pelo elemento
            if (match) {
                html = html.replace(match, pollElement);
            } else {
                html = pollElement;
            }
            // Atualiza o conteúdo da página
            return element.innerHTML = html;
        }

        const pollElement = `<div betterbluesky_poll_id="${poll.id}"><div class="betterbluesky_poll" voted="${poll.voted}">
        <span class="betterbluesky_poll_title">${escapeHTML(poll.title)}</span>
        <div class="betterbluesky_poll_options">
            ${poll.options.map((option, index) => `
                <button class="betterbluesky_poll_option" betterbluesky_poll_option_data='${JSON.stringify({ pollid: poll.id, option: index, voted: poll.voted })}' option_selected="${option.selected}">
                    <span class="betterbluesky_poll_option_text">${escapeHTML(option.text)}</span>
                    <img class="betterbluesky_poll_option_votedicon" src="https://cdn-icons-png.flaticon.com/512/1442/1442912.png"/>
                    <span class="betterbluesky_poll_votecount">${option.voteCount} voto${option.voteCount === 1 ? "" : "s"}</span>
                </button>`).join(" ")}
        </div>
        <span class="betterbluesky_poll_bybetterbluesky">Fornecido por <a target="_blank" href="https://nemtudo.me/betterbluesky">BetterBluesky</a></span>
    </div></div>`;

        // Substitui o match atual pelo elemento
        if (match) {
            html = html.replace(match, pollElement);
        } else {
            html = pollElement;
        }
        // Atualiza o conteúdo da página
        element.innerHTML = html;
    })
}

async function getPoll(pollID) {
    const request = await fetch(`${apiDomain}/api/polls/${pollID}?sessionID=${sessionID}`);
    if (request.status != 200) {
        return null
    }
    const poll = await request.json();
    return poll
}

async function votePoll(pollID, option) {
    console.log(`[BetterBluesky] Voting poll ${pollID}: ${option}`)
    const request = await fetch(`${apiDomain}/api/polls/${pollID}/votes?option=${option}&sessionID=${sessionID}`, {
        method: "POST"
    });
    const response = await request.json();

    if (request.status != 200) {
        console.log(request, response)
        alert(`Erro ao votar: ${response.message}`)
        return null
    }

    const pollElements = document.querySelectorAll(`div[betterbluesky_poll_id="${response.pollId}"]`);

    replaceBetterBlueSkyPoll(response.pollId, pollElements)

    return response
}


(function () { //easter egg trem de tópicos
    let typed = ""; // String para armazenar as teclas pressionadas
    const target = "tremdetopicos"; // A sequência que você quer detectar
    const maxLength = target.length; // Tamanho da sequência alvo

    document.addEventListener("keydown", function (event) {
        if (betterblueskystorage.trendingTopics == false) return; // There is no point for this easter egg if trending topics are disabled.
        // Adiciona a tecla pressionada à string
        typed += event.key.toLowerCase(); // Converte para minúscula para comparação

        // Mantém a string com no máximo o tamanho da sequência alvo
        if (typed.length > maxLength) {
            typed = typed.slice(-maxLength);
        }

        // Verifica se a sequência alvo foi digitada
        if (typed === target) {
            if (!betterblueskystorage.easter_egg_tremdetopicos) {
                if (document.querySelector("#trendingsname")) document.querySelector("#trendingsname").innerHTML = "Trem de Tópicos <span class='beta'>BETA</span>"
                sendStats("context.easteregg.activated", `{"typed": "${typed}"}`)
                updatePreferences("easter_egg_tremdetopicos", true)
            } else {
                if (document.querySelector("#trendingsname")) document.querySelector("#trendingsname").innerHTML = "Trending Topics <span class='beta'>BETA</span>"
                sendStats("context.easteregg.disabled", `{"typed": "${typed}"}`)
                updatePreferences("easter_egg_tremdetopicos", false)
            }
        }
    });
})();


function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

function randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function updateSetting(setting, value) {
    const storage = JSON.parse(localStorage.getItem("BETTERBLUESKY"));

    storage[setting] = value;

    localStorage.setItem("BETTERBLUESKY", JSON.stringify(storage));

    betterblueskystorage = storage;
}

function getViewingProfile() {
    const url = window.location.href;
    const parts = url.split('/').filter(part => part); // Remove strings vazias
    return parts[parts.length - 1]; // Retorna o último segmento
}

function getImgurVideoLink(url) {
    if (!url) return null;
    const imgurRegex = /https?:\/\/(?:i\.)?imgur\.com\/([^.\s/]+)(\.\w+)?/;
    const match = url.match(imgurRegex);

    if (match) {
        const id = match[1];
        const extension = match[2] || '.mp4'; // Se não houver extensão, assume que é .mp4
        return `https://i.imgur.com/${id}${extension}`;
    }

    return url; // Retorna o link original se não for do imgur
}

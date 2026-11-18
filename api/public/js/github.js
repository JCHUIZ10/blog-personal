document.addEventListener("DOMContentLoaded", async () => {
    const repoContainer = document.getElementById("github-repos");
    if (!repoContainer) return;

    const username = "JCHUIZ10";

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=9`);
        if (!response.ok) throw new Error("No se pudo conectar con GitHub");

        const repos = await response.json();
        repoContainer.innerHTML = "";

        repos.forEach(repo => {
            if (repo.fork) return; // Muestra solo tus proyectos originales

            const card = document.createElement("article");
            card.className = "card";

            const language = repo.language ? repo.language : "Ingeniería / Docs";
            const description = repo.description ? repo.description : "Repositorio de código y experimentación técnica.";

            card.innerHTML = `
                <div>
                    <div class="card-tag">// ${language}</div>
                    <h3>${repo.name}</h3>
                    <p>${description}</p>
                </div>
                <a href="${repo.html_url}" target="_blank" class="card-link">Ver repositorio en GitHub &rarr;</a>
            `;

            repoContainer.appendChild(card);
        });
    } catch (error) {
        repoContainer.innerHTML = `<p style="color: #8A8D8F;">No se pudieron cargar los repositorios en este momento. Visita directamente <a href="https://github.com/JCHUIZ10" style="color: #F6C945;">github.com/JCHUIZ10</a>.</p>`;
    }
});

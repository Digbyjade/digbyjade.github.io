const client = contentful.createClient({
  space: "jr97yasrhmlv",
  accessToken: "qnLwSLnkUbzeiBC5BI1UvdmtoI-FCGUJk4SksUzqBBU",
});
const main = document.getElementById("main");

async function init() {
  await buildPagesNav();
  window.addEventListener("hashchange", onHashChange, false);
  onHashChange();
}

let otherPages = null;

async function buildPagesNav() {
  if (!otherPages) {
    const { items } = await client.getEntries({
      content_type: "otherPage",
    });
    otherPages = items;
  }
  const list = document.getElementById("nav");
  for (const page of otherPages) {
    if (page.fields.appearsInNavMenu) {
      const navItem = document.createElement("li");
      navItem.innerHTML = `<a href="#page---${page.fields.urlFragment}">${page.fields.title}</a>`;
      list.appendChild(navItem);
    }
  }
}

async function onHashChange() {
  main.innerHTML = "";
  const [section, data] = window.location.hash.slice(1).split("---");
  if (section === "page" || section === "") {
    await renderPage(data);
  } else if (section === "project") {
    await renderProject(data);
  } else if (section === "projects") {
    await renderProjectsSection();
  } else {
    await render404();
  }
  applyLightboxes();
}

const customRenderers = {
  renderNode: {
    "embedded-entry-block": (node) => {
      const type = node.data.target.sys.contentType.sys.id;
      if (type === "mediaGrid") {
        return `<div class="masonry">${node.data.target.fields.items
          .map((item) => {
            try {
              if (item.fields.file.contentType === "image/tiff") {
                throw new Error(
                  `Tiff files don't work in the browser, failed to display ${item.fields.title}`
                );
              }
              return `<div class="brick embedded-asset-block">
        <img
          src="//${item.fields.file.url}"
          height="${item.fields.file.details.image.height}"
          width="${item.fields.file.details.image.width}"
          alt="${item.fields.description}"
        />
      </div>`;
            } catch (err) {
              console.error(err);
              return `<div class="brick">Problem encountered: ${err}</div>`;
            }
          })
          .join("\n")}</div>`;
      }
    },
    "embedded-asset-block": (node) => {
      try {
        if (item.fields.file.contentType === "image/tiff") {
          throw new Error(
            `Tiff files don't work in the browser, failed to display ${item.fields.title}`
          );
        }
        return `<div class="brick embedded-asset-block">
      <img
        src="//${node.data.target.fields.file.url}"
        height="${node.data.target.fields.file.details.image.height}"
        width="${node.data.target.fields.file.details.image.width}"
        alt="${node.data.target.fields.description}"
      />
    </div>`;
      } catch (err) {
        console.error(err);
        return `<div class="brick">Problem encountered: ${err}</div>`;
      }
    },
  },
};

async function renderProjectsSection() {
  if (!projects) {
    const { items } = await client.getEntries({
      content_type: "project",
    });
    projects = items;
  }
  const grid = document.createElement("div");
  grid.className = "masonry pageContent";
  main.appendChild(grid);
  for (const project of projects) {
    const { title, coverphoto, urlFragment } = project.fields;
    const p = document.createElement("div");
    p.className = "brick";
    p.innerHTML = `
    <a href="#project---${urlFragment}">
      <div class="title">${title}</div>
      <img src="${coverphoto.fields.file.url}" alt="${coverphoto.fields.title}"/>
    </a>`;
    grid.appendChild(p);
  }
}

async function renderPage(pageSlug) {
  if (!otherPages) {
    const { items } = await client.getEntries({
      content_type: "otherPage",
    });
    otherPages = items;
  }
  if (pageSlug === "" || pageSlug === undefined) {
    pageSlug = "home";
  }
  const page = otherPages.find((page) => page.fields.urlFragment === pageSlug);
  if (page) {
    main.innerHTML = `
    <div class="pageContent">${documentToHtmlString(
      page.fields.content,
      customRenderers
    )}</div>`;
  } else {
    render404();
  }
}

let projects = null;

async function renderProject(projectSlug) {
  if (!projects) {
    const { items } = await client.getEntries({
      content_type: "project",
    });
    projects = items;
  }
  const project = projects.find(
    (project) => project.fields.urlFragment === projectSlug
  );
  if (project) {
    main.innerHTML = `
    <div class="pageContent">${documentToHtmlString(
      project.fields.content,
      customRenderers
    )}</div>`;
  } else {
    render404();
  }
}

async function render404() {
  main.innerHTML = `<p>oops! looks like you're lost</p><p><a href="#">go home</a></p>`;
}

function applyLightboxes() {
  [...document.getElementsByClassName("brick")].forEach((el) => {
    if (el.classList.contains("embedded-asset-block")) {
      el.addEventListener("click", () => {
        basicLightbox.create(`<img src="${el.children[0].src}">`).show();
      });
    }
  });
}

init();

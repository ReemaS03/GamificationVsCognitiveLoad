let pages = [
    { url: './index.html', title: 'Stroop Test' },
    { url: './plot.html', title: 'Plot' },
    { url: './writeup.html', title: 'Writeup' }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
}


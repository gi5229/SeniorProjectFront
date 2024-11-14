var firstClick = true;

addEventListener('load',async  () =>{
  const profile = await window.electronAPI.getProfile();
  document.getElementById('picture').src = profile.picture;
  // document.getElementById('success').innerText = 'You successfully used OpenID Connect and OAuth 2.0 to authenticate.';
});

document.getElementById('logout').onclick = () => {
  window.electronAPI.logOut();
};

document.getElementById('hamburger-menu').addEventListener('click', function() {
  this.classList.toggle('active');
  document.getElementById('nav-profile').classList.toggle('open');
});



document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('home-button').addEventListener('click', () => loadPage('page1.html'));
  document.getElementById('drives-button').addEventListener('click', () => loadPage('files.html'));
  document.getElementById('usage-button').addEventListener('click', () => loadPage('usage.html'));
  document.getElementById('account-button').addEventListener('click', () => loadPage('account.html'));
});

async function loadPage(page) {
  const content = document.getElementById('content');
  const hamburger = document.getElementById('hamburger-menu');
  const navProfile = document.getElementById('nav-profile');

  if(firstClick == false){
    const hamburger = document.getElementById('hamburger-menu');
    const navProfile = document.getElementById('nav-profile');

    hamburger.classList.toggle('active');
    navProfile.classList.toggle('open');
  } else {
    firstClick = false;
  }

  content.classList.add('fade-out');

  // Wait for the fade-out transition to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  const response = await fetch(page);
  const newContent = await response.text();
  content.innerHTML = newContent;
  content.classList.remove('fade-out');
}

// Load the initial page
loadPage('page1.html');



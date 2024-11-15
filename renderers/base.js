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

async function initializeDatasets() {
  // reload the tokens
  await window.electronAPI.refreshTokens();

  const profile = await window.electronAPI.getProfile();
  const datasets = profile.datasets;

  const container = document.getElementById('dataset-container');

  datasets.forEach((dataset, index) => {
      // Create a dropdown and button for each dataset
      const div = document.createElement('div');
      div.innerHTML = `
          <select id="drive-letter-${index}">
              ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                  .map(letter => `<option value="${letter}">${letter}</option>`)
                  .join('')}
          </select>
          <span>//${dataset}/</span>
          <button id="connect-${index}" class="connect-btn">Connect</button>
      `;
      container.appendChild(div);

      // Add event listener for the connect button
      document.getElementById(`connect-${index}`).onclick = () => {
          const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
          console.log(`Connecting to dataset: ${dataset} with drive letter: ${selectedDriveLetter}`);
          window.electronAPI.mountDrive(selectedDriveLetter, profile.drive + '\\' + dataset);
      };
  });
}



document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('home-button').addEventListener('click', () => loadPage('page1.html'));
  document.getElementById('drives-button').addEventListener('click', () => loadPage('files.html'));
  document.getElementById('usage-button').addEventListener('click', () => loadPage('usage.html'));
  document.getElementById('account-button').addEventListener('click', () => loadPage('account.html'));
  document.getElementById('settings-button').addEventListener('click', () => loadPage('settings.html'));
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
  if (page === 'files.html') {
    await initializeDatasets();
    document.getElementById('create-drive').onclick = async () => {
      try {
        console.log('Creating a new drive: ' + document.getElementById('drive-name').value);
        const response = await window.electronAPI.createDrive(document.getElementById('drive-name').value);
        addDriveToList(document.getElementById('drive-name').value);
      } catch (error) {
        console.error('Error connecting to the API: ' + error);
      }
    };
  }
  content.classList.remove('fade-out');
}

function addDriveToList(driveName) {
  const container = document.getElementById('dataset-container');
  const index = container.children.length;
  const div = document.createElement('div');
  div.innerHTML = `
    <select id="drive-letter-${index}">
      ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
        .map(letter => `<option value="${letter}">${letter}</option>`)
        .join('')}
    </select>
    <span>//${driveName}/</span>
    <button id="connect-${index}" class="connect-btn">Connect</button>
  `;
  container.appendChild(div);

  document.getElementById(`connect-${index}`).onclick = () => {
    const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
    console.log(`Connecting to dataset: ${driveName} with drive letter: ${selectedDriveLetter}`);
    window.electronAPI.mountDrive(selectedDriveLetter, driveName);
  };
}

// Load the initial page
loadPage('page1.html');







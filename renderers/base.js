var firstClick = true;
let darkmode = localStorage.getItem('darkmode')

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {
  }
}

if (darkmode === 'active') {
  enableDarkmode()
}

addEventListener('load',async  () =>{
  //const profile = await window.electronAPI.getProfile();
  //document.getElementById('picture').src = profile.picture;
  // document.getElementById('success').innerText = 'You successfully used OpenID Connect and OAuth 2.0 to authenticate.';
});

document.getElementById('logout').onclick = () => {
  window.electronAPI.createLogoutWindow();
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
    // Clear the container
    container.innerHTML = '';
  
    // Check if any of the users datasets are already mounted
    const mountedDrive = await window.electronAPI.getMountedDrive();

    
  
    
  
  
    datasets.forEach((dataset, index) => {
      if (mountedDrive && mountedDrive.providerName === dataset) {
        // If the dataset is already mounted, show a disconnect button instead
        const div = document.createElement('div');
        div.className = 'create-drive';
        div.innerHTML = `
            <span>${mountedDrive.letter}:</span>
            <span>//${dataset}/</span>
            <button id="disconnect-${index}" class="disconnect-btn black-text">Disconnect</button>
        `;
        container.appendChild(div);


        // Add event listener for the disconnect button
        document.getElementById(`disconnect-${index}`).onclick = async () => {
          console.log(`Disconnecting from dataset: ${dataset} with drive letter: ${mountedDrive.letter}`);
          await window.electronAPI.unmountDrive(mountedDrive.letter);
          initializeDatasets();
        }
      } else {
        // Create a dropdown and button for each dataset
        const div = document.createElement('div');
        div.className = 'create-drive';
        // Dont include the drive letter if it is in mountedDrive.letters
        if(mountedDrive != null) {
          console.log('index: ', index)
          div.innerHTML = `
              <select id="drive-letter-${index}" class="black-text">
                  ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .filter(letter => !mountedDrive.letters.includes(letter))
                    .map(letter => `<option value="${letter}" class="black-text">${letter}</option>`)
                    .join('')}
              </select>
              <span>//${dataset}/</span>
              <button id="connect-${index}" class="connect-btn black-text">Connect</button>
          `;
        } else {
          console.log('index: ', index)
          div.innerHTML = `
              <select id="drive-letter-${index}" class="black-text">
                  ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .map(letter => `<option value="${letter}" class="black-text">${letter}</option>`)
                    .join('')}
              </select>
              <span>//${dataset}/</span>
              <button id="connect-${index}" class="connect-btn black-text">Connect</button>
          `;
        }
        container.appendChild(div);
        console.log('index: ', index)
        // Add event listener for the connect button
        document.getElementById(`connect-${index}`).onclick = () => {
          // Check if another drive is already mounted and unmount it first and wait for it to finish
          if (mountedDrive) {
            window.electronAPI.unmountDrive(mountedDrive.letter);
          }
          // Wait for 2 seconds to make sure the drive is unmounted before mounting a new one
          //sleep(2000);
          
          
          const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
          console.log(`Connecting to dataset: ${dataset} with drive letter: ${selectedDriveLetter}`);
          window.electronAPI.mountDrive(selectedDriveLetter, profile.drive + '\\' + dataset);
          initializeDatasets();
        }
      }
  });
}



document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('home-button').addEventListener('click', () => loadPage('page1.html'));
  document.getElementById('drives-button').addEventListener('click', () => loadPage('files.html'));
  document.getElementById('usage-button').addEventListener('click', () => loadPage('usage.html'));
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
  } else if (page === 'settings.html') {
    var slider = document.getElementById('color-slider');

    if(localStorage.getItem('darkmode') === 'active') {
      slider.checked = true;
    } else {
      slider.checked = false;
    }
  
    document.getElementById('color-slider').addEventListener("change", function() {

      if (this.checked) {
        enableDarkmode()
      } else {
        disableDarkmode()
      }
    });
    

    document.getElementById('change-email').onclick = async () => {
      const newEmail = document.getElementById('new-email').value;
      await window.electronAPI.changeEmail(newEmail);
    };

    
    document.getElementById('change-password').onclick = async () => {
      const newPassword = document.getElementById('new-password').value;
      await window.electronAPI.changePassword(newPassword);
    };
  };

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
function enableDarkmode()  {
  document.body.classList.remove('defaultColor')
  document.body.classList.add('darkmode')
  localStorage.setItem('darkmode', 'active')
}

function disableDarkmode () {
  document.body.classList.add('defaultColor')
  document.body.classList.remove('darkmode')
  localStorage.setItem('darkmode', null)
}

// Load the initial page
loadPage('page1.html');








addEventListener('load',async  () =>{
    


    const profile = await window.electronAPI.getProfile();
    document.getElementById('picture').src = profile.picture;
    document.getElementById('name').innerText = profile.name;


    
    const token = await window.electronAPI.getAccessToken();
    document.getElementById('success').innerText = token;
    console.log(idToken);
  });
  
  document.getElementById('logout').onclick = () => {
    window.electronAPI.logOut();
  };
  
  document.getElementById('secured-request').onclick = async () => {
    try {
      const response = await window.electronAPI.getPrivateData();
      const messageJumbotron = document.getElementById('message');
      messageJumbotron.innerText = response;
      messageJumbotron.style.display = 'block';
    } catch(error) {
      console.error('Error connecting to te API: ' + error);
    }
  };
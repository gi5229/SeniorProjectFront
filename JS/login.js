document.getElementById('adminForm').addEventListener('submit', function(event){
    event.preventDefault(); 


    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log(username, password);
 
    // const requestData = {
    //     username: username,
    //     password: password
    // };

    fetch('http://localhost:9090/auth?username=' + username + '&password=' + password, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        //body: JSON.stringify(requestData),

    })
    .then(response => response.text())
    .then(apiKey => {
        console.log(apiKey);

        localStorage.setItem('apiKey', apiKey);
        // Handle the API token as needed
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
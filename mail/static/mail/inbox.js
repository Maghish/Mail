document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  document.querySelector("#compose-form").addEventListener("submit", () => {

    event.preventDefault();

    // Retreive all the values in the compose form
    const recipients = document.querySelector("#compose-recipients").value 
    const subject = document.querySelector("#compose-subject").value
    const body = document.querySelector("#compose-body").value

    // Send the email using POST method
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
      })
      .then(response => response.json())
      .then(result => {

          // Print the result just in case anything went wrong and it would be easy to debug  
          console.log(result);

          // Load the sent
          load_mailbox('sent');
    });
      
});  

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Use the displayMails function to display all the emails the mailbox has  
  displayMails(mailbox);
}

function displayMails(mailbox) {
    
    // Remove the Div element instead of hiding it, because it would later be hard to add new elements if any changes made
    document.querySelector("#emails-view").innerHTML = "";

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        
        // Check if there is no emails in the mailbox, if so create an element for displaying the message
        if (emails.length <= 0) {
            const element = document.createElement('div');
            element.className = "alert alert-dark";
            element.role = "alert";
            element.innerHTML = `No emails found in your ${mailbox}`;
            
            document.querySelector("#emails-view").append(element);    
        }

        else {
            // Else, loop over all the emails and add it to the #emails-view div


            // Also check if the mailbox is archive
            if (mailbox === "archive") {
                
                emails.forEach(email => {

                    // Check if the email is archived
                    if (email.archived === true) {

                        const element = document.createElement('div');
                        element.className = `mail-div ${email.read ? 'mail-div-read' : 'mail-div-unread'}`
                        element.innerHTML = `<p class="mail-div-items" style="font-weight: bold;">${email.sender}</p>
                                             <p class="mail-div-items" style="text-align: center;">${email.subject}</p>
                                             <p class="mail-div-items" style="text-align: right;">${email.timestamp}</p>`;
    
                    
                        element.addEventListener('click', () => viewMail(email.id));
    
                    
                        document.querySelector("#emails-view").append(element);

                    }

                    // Else do nothing and pass
                    else {}
                    
                })
            }

            // Else
            else {
            
                emails.forEach(email => {

                    // Check if the email is unarchived
                    if (email.archived === false) {
                        const element = document.createElement('div');
                        element.className = `mail-div ${email.read ? 'mail-div-read' : 'mail-div-unread'}`
                        element.innerHTML = `<p class="mail-div-items" style="font-weight: bold;">${email.sender}</p>
                                            <p class="mail-div-items" style="text-align: center;">${email.subject}</p>
                                            <p class="mail-div-items" style="text-align: right;">${email.timestamp}</p>`;

                        
                        element.addEventListener('click', () => viewMail(email.id));

                        
                        document.querySelector("#emails-view").append(element);

                    }

                    // Else do nothing and pass
                    else {}
                    
                })
        
            }
        }
});

}

function viewMail(id) {

    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {

        // Create a div to store the archive button and reply button
        const btnDiv = document.createElement('div');
        btnDiv.className = 'btn-div'


        // Create archive button
        const archiveBTN = document.createElement("button");
        archiveBTN.innerHTML = email.archived ? "Unarchive": "Archive"; // Check if the email is not already archived, if so change the value to "Archive"
        archiveBTN.className = email.archived ? "btn btn-success btn-div-items" : "btn btn-danger btn-div-items"; // Else if it is archived, change the value to "Unarchive"
        archiveBTN.style.marginRight = "10px"

        archiveBTN.addEventListener("click", () => {
 
                if (email.archived  === true) {

                    // If the email is archived, then unarchive it
                    fetch(`/emails/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            archived: false
                        })
                    })
                
                    load_mailbox("inbox")
                }

                else {

                    // If the email is unarchived, then archive it
                    fetch(`/emails/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            archived: true
                        })
                    })
                
                    load_mailbox("inbox")
                
                }            
            })
           
        // Create reply button
        const replyBTN = document.createElement("button");
        replyBTN.innerHTML = "Reply";
        replyBTN.className = "btn btn-primary btn-div-items";
        
        replyBTN.addEventListener("click", () => replyEmail(email));


        const element = document.createElement('div');
        element.className = 'mail-view-div';
        element.innerHTML = `<p style="font-size: larger; margin-bottom:  0px;"><strong>From: </strong>${email.sender}</p>
                             <p style="font-size: larger; margin-bottom:  0px;"><strong>To: </strong>${email.recipients}</p>
                             <p style="font-size: larger; margin-bottom:  0px;"><strong>Subject: </strong>${email.subject}</p>
                             <p style="font-size: larger; margin-bottom:  0px;"><strong>Timestamp: </strong>${email.timestamp}</p>
                             <hr>
                             <p>${email.body}</p>`

        // Remove the Div element instead of hiding it, because it would later be hard to add new elements if any changes made
        document.querySelector("#emails-view").innerHTML = "";

        document.querySelector("#emails-view").append(btnDiv);
        btnDiv.append(archiveBTN)
        btnDiv.append(replyBTN)
        document.querySelector("#emails-view").append(element);

    });

    // Finally, set the email as read
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })


}

function replyEmail(email) {

    // Hide all the divs
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display ="block";

    // Pre-fill all the fields in the compose form
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
}
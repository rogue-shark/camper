 // Example starter JavaScript for disabling form submissions if there are invalid fields
 // IIFE - https://developer.mozilla.org/en-US/docs/Glossary/IIFE
 (function () {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.to-be-validated')
  
    // Loop over them and prevent submission
    Array.from(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation() //https://www.w3schools.com/jsref/event_stoppropagation.asp#:~:text=The%20stopPropagation(),to%20child%20elements.
          }
  
          form.classList.add('was-validated')
        }, false)
      })
  })()
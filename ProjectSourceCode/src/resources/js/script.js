document.addEventListener('DOMContentLoaded', function () {
    const openModalButton = document.getElementById('openNewPostButton');
    const postPriceFormContainer = document.getElementById('postPriceFormContainer');
    const closePostFormButton = document.getElementById('closePostFormButton');
  
    if (openModalButton && postPriceFormContainer && closePostFormButton) {
      openModalButton.addEventListener('click', function () {
        postPriceFormContainer.style.display = 'block'; // Show the form
      });
  
      closePostFormButton.addEventListener('click', function () {
        postPriceFormContainer.style.display = 'none'; // Hide the form
      });
    } else {
      console.error('Button or form container not found.');
    }
  });

document.addEventListener(
  
);
  
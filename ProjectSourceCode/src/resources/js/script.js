document.addEventListener('DOMContentLoaded', function () {
    const openModalButton = document.getElementById('openNewPostButton');
    const postPriceFormContainer = document.getElementById('postPriceFormContainer');
    const closePostFormButton = document.getElementById('closePostFormButton');
  
    if (openModalButton && postPriceFormContainer && closePostFormButton) {
      openModalButton.addEventListener('click', function () {
        postPriceFormContainer.style.display = 'block'; // Show the form
      });
  
      closePostFormButton.addEventListener('click', function () {
        postPriceFormContainer.style.display = 'none'; //
      });
    } else {
      console.error('Button or form container not found.');
    }
  });
  
  document.addEventListener('DOMContentLoaded', async function () {
    const bountyFeed = document.getElementById('bountyFeed'); // display 

    // get bountys
    async function fetchBounties() {
        try {
            const response = await fetch('/getBounties'); // Fget backend
            const bounties = await response.json();

            // clear feed
            bountyFeed.innerHTML = '';

            // Iterate
            bounties.forEach(bounty => {
                const bountyElement = document.createElement('div');
                bountyElement.className = 'bounty-item';
                bountyElement.innerHTML = `
                    <h3>${bounty.itemName}</h3>
                    <p><strong>Price:</strong> $${bounty.price}</p>
                    <p><strong>Posted By:</strong> User ${bounty.userId}</p>
                    <p><strong>Posted At:</strong> ${new Date(bounty.createdAt).toLocaleString()}</p>
                `;
                bountyFeed.appendChild(bountyElement);
            });
        } catch (error) {
            console.error('Error fetching bounties:', error);
        }
    }
    //load the whole shabang
    fetchBounties();
});

  
document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const newEmailInput = document.getElementById('newEmail');
    const addEmailBtn = document.getElementById('addEmailBtn');
    const emailPositionInput = document.getElementById('emailPosition');
    const generateBtn = document.getElementById('generateBtn');
    const generatedEmailContainer = document.getElementById('generatedEmailContainer');
    const generatedEmailElement = document.getElementById('generatedEmail');
    const emailList = document.getElementById('emailList');
    const emailCount = document.getElementById('emailCount');
    const emptyState = document.getElementById('emptyState');
    const lastGeneratedText = document.getElementById('lastGeneratedText');
    const addEmailError = document.getElementById('addEmailError');
    const generateError = document.getElementById('generateError');
    const copyBtn = document.getElementById('copyBtn');
    const toast = document.getElementById('toast');
    const clearAllBtn = document.getElementById('clearAllBtn');
  
    // State
    let emails = JSON.parse(localStorage.getItem('emails')) || [];
    let lastGenerated = localStorage.getItem('lastGenerated') || null;
  
    // Init
    updateEmailList();
    updateLastGenerated();
  
    // Events
    addEmailBtn.addEventListener('click', addEmail);
    newEmailInput.addEventListener('keypress', e => e.key === 'Enter' && addEmail());
    generateBtn.addEventListener('click', generateEmail);
    emailPositionInput.addEventListener('keypress', e => e.key === 'Enter' && generateEmail());
    copyBtn.addEventListener('click', function() {
const emailText = generatedEmailElement.textContent.trim();
if (!emailText) return;

// Try Clipboard API first
if (navigator.clipboard && window.isSecureContext) {
  navigator.clipboard.writeText(emailText).then(() => {
    showToast('Email copied to clipboard!');
  }).catch(err => {
    console.error('Clipboard API failed:', err);
    fallbackCopy(emailText);
  });
} else {
  fallbackCopy(emailText);
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    showToast(successful ? 'Email copied to clipboard!' : 'Failed to copy email.');
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showToast('Failed to copy email.');
  }
  document.body.removeChild(textarea);
}
});
    clearAllBtn.addEventListener('click', clearAllEmails);
  
    // Functions
    function addEmail() {
      const emailText = newEmailInput.value.trim().toLowerCase();
      if (!isValidEmail(emailText)) {
        showError(addEmailError, 'Please enter a valid email address');
        return;
      }
  
      const [usernameRaw, domain] = emailText.split('@');
      if (!usernameRaw || !domain || domain !== 'gmail.com') {
        showError(addEmailError, 'Only Gmail addresses are supported');
        return;
      }
  
      const username = usernameRaw.replace(/\./g, '');
      const variations = generateAllDotCombinations(username, domain);
      emails = [...new Set([...emails, ...variations])];
  
      localStorage.setItem('emails', JSON.stringify(emails));
      newEmailInput.value = '';
      addEmailError.classList.add('hidden');
      updateEmailList();
      showToast(`Generated ${variations.length} email variations!`);
    }
  
  function generateAllDotCombinations(username, domain) {
  const variations = new Set();
  const maxVariations = 256; // To avoid performance issues
  const dotCombos = [];

  const len = username.length;
  const totalDotCombos = Math.pow(2, len - 1); // All dot patterns

  // Step 1: Generate all dot combinations
  for (let i = 0; i < totalDotCombos; i++) {
      let combo = username[0];
      for (let j = 1; j < len; j++) {
          if ((i & (1 << (j - 1))) !== 0) {
              combo += '.';
          }
          combo += username[j];
      }
      dotCombos.push(combo);
      if (dotCombos.length >= maxVariations) break;
  }

  // Step 2: Add dot-only variations
  for (const base of dotCombos) {
      if (variations.size >= maxVariations) break;
      variations.add(base + '@' + domain);
  }

  // Step 3: Add dot + plus-alias variations
  let aliasCounter = 1;
  for (const base of dotCombos) {
      if (variations.size >= maxVariations) break;
      variations.add(`${base}+${aliasCounter}@${domain}`);
      aliasCounter++;
  }

  // Step 4: Add plus-alias without dots if needed
  for (let i = 1; variations.size < 128 && i <= 100; i++) {
      variations.add(`${username}+alias${i}@${domain}`);
  }

  return Array.from(variations); // Return the variations without the base email
}


  
    function generateEmail() {
if (emails.length === 0) {
  showError(generateError, 'No emails available to generate');
  return;
}

let positionInput = emailPositionInput.value.trim();
let position;

if (positionInput === '') {
  position = lastGenerated ? parseInt(lastGenerated) + 1 : 1;
  if (position > emails.length) position = 1;
} else {
  position = parseInt(positionInput);
  if (isNaN(position) || position < 1 || position > emails.length) {
    showError(generateError, `Please enter a number between 1 and ${emails.length}`);
    return;
  }
}

const email = emails[position - 1];
generatedEmailElement.textContent = email;
generatedEmailContainer.classList.remove('hidden');
generateError.classList.add('hidden');

lastGenerated = position;
localStorage.setItem('lastGenerated', lastGenerated);
updateLastGenerated();
showToast(`Generated email #${position}`);

emailPositionInput.value = '';

}

  
    function updateEmailList() {
      emailCount.textContent = `${emails.length} email${emails.length !== 1 ? 's' : ''}`;
  
      if (emails.length === 0) {
        emptyState.classList.remove('hidden');
        emailList.classList.add('hidden');
      } else {
        emptyState.classList.add('hidden');
        emailList.classList.remove('hidden');
      }
  
      emailList.innerHTML = '';
      emails.forEach((email, index) => {
        const li = document.createElement('li');
        li.className = 'py-3 flex justify-between items-center';
  
        const emailDiv = document.createElement('div');
        emailDiv.className = 'flex items-center';
  
        const numberSpan = document.createElement('span');
        numberSpan.className = 'w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mr-3 flex-shrink-0';
        numberSpan.textContent = index + 1;
  
        const emailText = document.createElement('p');
        emailText.className = 'text-gray-700 break-all';
        emailText.textContent = email;
  
        emailDiv.appendChild(numberSpan);
        emailDiv.appendChild(emailText);
  
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'ri-delete-bin-line';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.addEventListener('click', () => deleteEmail(index));
  
        li.appendChild(emailDiv);
        li.appendChild(deleteBtn);
        emailList.appendChild(li);
      });
  
      emailPositionInput.setAttribute('max', emails.length);
      emailPositionInput.setAttribute('placeholder', emails.length > 0 ? `1-${emails.length}` : '0');
    }
  
    function deleteEmail(index) {
      emails.splice(index, 1);
      localStorage.setItem('emails', JSON.stringify(emails));
      updateEmailList();
  
      if (lastGenerated && (lastGenerated > emails.length || lastGenerated === index + 1)) {
        lastGenerated = emails.length > 0 ? emails.length : null;
        localStorage.setItem('lastGenerated', lastGenerated);
        updateLastGenerated();
      }
  
      showToast('Email deleted');
    }
  
    function clearAllEmails() {
      if (emails.length === 0) return;
      if (confirm('Are you sure you want to delete all emails?')) {
        emails = [];
        localStorage.setItem('emails', JSON.stringify(emails));
        lastGenerated = null;
        localStorage.setItem('lastGenerated', lastGenerated);
        updateEmailList();
        updateLastGenerated();
        generatedEmailContainer.classList.add('hidden');
        showToast('All emails cleared');
      }
    }
  
    function updateLastGenerated() {
      lastGeneratedText.textContent = lastGenerated && emails.length > 0
        ? `Last Generated: #${lastGenerated}`
        : 'Last Generated: None';
    }
  
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    function showError(element, message) {
      element.textContent = message;
      element.classList.remove('hidden');
    }
  
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('opacity-100');
      setTimeout(() => {
        toast.classList.remove('opacity-100');
      }, 2000);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
const welcomeModal = document.getElementById('welcomeModal');
const closeWelcomeModal = document.getElementById('closeWelcomeModal');

// Show modal on load
welcomeModal.classList.remove('hidden');

// Close modal on button click
closeWelcomeModal.addEventListener('click', () => {
  welcomeModal.classList.add('hidden');
});
});

document.getElementById('toggleSidebar').addEventListener('click', function () {
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const icon = document.getElementById('sidebarIcon');

sidebar.classList.toggle('show');
overlay.classList.toggle('hidden');

if (sidebar.classList.contains('show')) {
  document.body.classList.add('overflow-hidden');
} else {
  document.body.classList.remove('overflow-hidden');
}


// Toggle icon
if (sidebar.classList.contains('show')) {
  icon.classList.remove('ri-menu-line');
  icon.classList.add('ri-close-line');
} else {
  icon.classList.remove('ri-close-line');
  icon.classList.add('ri-menu-line');
}
});

document.getElementById('overlay').addEventListener('click', function () {
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const icon = document.getElementById('sidebarIcon');

sidebar.classList.remove('show');
overlay.classList.add('hidden');
document.body.classList.remove('overflow-hidden');
icon.classList.remove('ri-close-line');
icon.classList.add('ri-menu-line');
});
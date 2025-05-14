// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAluITpJ70RvaGNpCo6zooJnL0n8vThMzw",
    authDomain: "login-spacex.firebaseapp.com",
    projectId: "login-spacex",
    storageBucket: "login-spacex.appspot.com",
    messagingSenderId: "927608915119",
    appId: "1:927608915119:web:56f1a70c333cddd7ee405a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginPanel = document.getElementById('login-panel');
const registerPanel = document.getElementById('register-panel');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const switchFormLinks = document.querySelectorAll('.switch-form');

switchFormLinks.forEach(link => {
    link.addEventListener('click', () => {
        const target = link.getAttribute('data-target');
        if (target === 'login') {
            loginPanel.classList.remove('hidden');
            registerPanel.classList.add('hidden');
        } else {
            loginPanel.classList.add('hidden');
            registerPanel.classList.remove('hidden');
        }
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    });
});

function showError(element, message) {
    element.textContent = message;
    element.className = 'form-message error-message';
    setTimeout(() => {
        element.textContent = '';
        element.className = 'form-message';
    }, 3000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'form-message success-message';
    setTimeout(() => {
        element.textContent = '';
        element.className = 'form-message';
    }, 3000);
}

// Registro
registerForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError(registerMessage, 'Las contraseñas no coinciden');
        return;
    }

    if (password.length < 6) {
        showError(registerMessage, 'La contraseña debe tener al menos 6 caracteres');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showSuccess(registerMessage, 'Cuenta creada exitosamente');
            registerForm.reset();

            // ✅ Redirección
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 1000);
        })
        .catch(error => {
            let errorMessage = 'Error al crear la cuenta';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Este correo ya está en uso';
            else if (error.code === 'auth/invalid-email') errorMessage = 'Correo electrónico inválido';
            showError(registerMessage, errorMessage);
        });
});

// Inicio de sesión
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showSuccess(loginMessage, 'Iniciando sesión...');
            loginForm.reset();
            setTimeout(() => {
                window.location.href = 'principal.html'; // ✅ Redirección tras login también
            }, 1000);
        })
        .catch(error => {
            let errorMessage = 'Error al iniciar sesión';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Correo o contraseña incorrectos';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Correo electrónico inválido';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Esta cuenta ha sido desactivada';
            }
            showError(loginMessage, errorMessage);
        });
});

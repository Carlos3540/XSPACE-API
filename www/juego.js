import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
        import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
        
        // Firebase configuración
        const firebaseConfig = {
            apiKey: "AIzaSyAkLgzUpQPcrnLKliR0fZjBZbo5ADZoBts",
            authDomain: "rocket-scape-92db3.firebaseapp.com",
            projectId: "rocket-scape-92db3",
            storageBucket: "rocket-scape-92db3.appspot.com",
            messagingSenderId: "830091161615",
            appId: "1:830091161615:web:333509e348c30e4d6d737a",
            measurementId: "G-5VCHVPVN67"
        };

        // Variables para Firebase
        let app, db;
        let firebaseInitialized = false;

        // Inicializar Firebase con manejo de errores
        try {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            firebaseInitialized = true;
            console.log("Firebase inicializado correctamente");
            loadTopScores(); // Cargar puntuaciones al iniciar
        } catch (error) {
            console.error("Error al inicializar Firebase:", error);
            showStatus("Error al conectar con Firebase: " + error.message, "error");
        }

        // Game elements
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        let score = 0;
        let gameOver = false;

        // Create rocket with fallback drawing if image fails
        const rocket = {
            x: 160,
            y: 520,
            width: 40,
            height: 60,
            img: new Image(),
            draw() {
                if (this.imgLoaded) {
                    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
                } else {
                    // Fallback drawing if image fails to load
                    ctx.fillStyle = "#ff4d4d";
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Draw rocket shape
                    ctx.fillStyle = "#ff9933";
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.width/2, this.y);
                    ctx.lineTo(this.x + this.width, this.y + this.height/3);
                    ctx.lineTo(this.x, this.y + this.height/3);
                    ctx.fill();
                }
            },
            imgLoaded: false
        };

        // Create asteroid with fallback drawing if image fails
        const asteroid = {
            x: Math.random() * 320,
            y: -60,
            width: 40,
            height: 40,
            speed: 4,
            img: new Image(),
            draw() {
                if (this.imgLoaded) {
                    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
                } else {
                    // Fallback drawing if image fails to load
                    ctx.fillStyle = "#999999";
                    ctx.beginPath();
                    ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add some crater details
                    ctx.fillStyle = "#666666";
                    ctx.beginPath();
                    ctx.arc(this.x + this.width/3, this.y + this.height/3, this.width/6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(this.x + this.width*2/3, this.y + this.height*2/3, this.width/8, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            imgLoaded: false
        };

        // Try to load images but don't wait for them
        rocket.img.src = "assets/cohete.png";
        rocket.img.onload = () => { rocket.imgLoaded = true; };
        rocket.img.onerror = () => { console.log("Failed to load rocket image, using fallback"); };

        asteroid.img.src = "assets/asteroide.png";
        asteroid.img.onload = () => { asteroid.imgLoaded = true; };
        asteroid.img.onerror = () => { console.log("Failed to load asteroid image, using fallback"); };

        // Start the game regardless of image loading
        update();

        function moveAsteroid() {
            asteroid.y += asteroid.speed;
            if (asteroid.y > canvas.height) {
                asteroid.y = -40;
                asteroid.x = Math.random() * (canvas.width - asteroid.width);
                score++;
                document.getElementById("score").innerText = "Puntuación: " + score;
            }
        }

        function checkCollision() {
            if (
                rocket.x < asteroid.x + asteroid.width &&
                rocket.x + rocket.width > asteroid.x &&
                rocket.y < asteroid.y + asteroid.height &&
                rocket.y + rocket.height > asteroid.y
            ) {
                gameOver = true;
                alert(`💥 ¡Perdiste! Puntaje: ${score}`);
                document.getElementById("saveScoreBtn").disabled = false;
            }
        }

        function showStatus(message, type) {
            const statusElement = document.getElementById("status");
            statusElement.textContent = message;
            statusElement.className = type;
            statusElement.style.display = "block";
            
            // Hide status after 5 seconds if it's a success
            if (type === "success") {
                setTimeout(() => {
                    statusElement.style.display = "none";
                }, 5000);
            }
        }

        // Cargar las mejores puntuaciones
        async function loadTopScores() {
            if (!firebaseInitialized) {
                document.getElementById("topScoresList").innerHTML = 
                    "<p>No se pueden cargar puntuaciones: Firebase no está inicializado</p>";
                return;
            }
            
            try {
                const topScoresQuery = query(
                    collection(db, "puntuaciones"),
                    orderBy("puntos", "desc"),
                    limit(3)
                );
                
                const querySnapshot = await getDocs(topScoresQuery);
                
                if (querySnapshot.empty) {
                    document.getElementById("topScoresList").innerHTML = 
                        "<p>No hay puntuaciones registradas aún</p>";
                    return;
                }
                
                let topScoresHTML = "";
                let position = 1;
                
                querySnapshot.forEach((doc) => {
                    const scoreData = doc.data();
                    const trophyEmoji = position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
                    
                    topScoresHTML += `
                        <div class="top-item">
                            <span class="trophy">${trophyEmoji}</span>
                            <span class="player-name">${scoreData.nombre}</span>
                            <span class="player-score">${scoreData.puntos} pts</span>
                        </div>
                    `;
                    position++;
                });
                
                document.getElementById("topScoresList").innerHTML = topScoresHTML;
                
            } catch (error) {
                console.error("Error al cargar las mejores puntuaciones:", error);
                document.getElementById("topScoresList").innerHTML = 
                    `<p>Error al cargar puntuaciones: ${error.message}</p>`;
            }
        }

        async function guardarPuntaje() {
            if (!firebaseInitialized) {
                showStatus("No se puede guardar: Firebase no está inicializado correctamente", "error");
                return;
            }
            
            const saveBtn = document.getElementById("saveScoreBtn");
            saveBtn.disabled = true;
            saveBtn.textContent = "Guardando...";
            
            const nombre = document.getElementById("playerName").value || "Anónimo";
            
            try {
                const docRef = await addDoc(collection(db, "puntuaciones"), {
                    nombre: nombre,
                    puntos: score,
                    fecha: new Date()
                });
                
                console.log("Puntuación guardada con ID:", docRef.id);
                showStatus("✅ ¡Puntuación guardada correctamente!", "success");
                
                saveBtn.textContent = "¡Guardado!";
                
                // Recargar las mejores puntuaciones después de guardar
                loadTopScores();
                
            } catch (error) {
                console.error("Error al guardar puntuación:", error);
                showStatus("Error al guardar la puntuación: " + error.message, "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "Guardar puntuación";
            }
        }

        function resetGame() {
            score = 0;
            gameOver = false;
            rocket.x = 160;
            asteroid.x = Math.random() * 320;
            asteroid.y = -60;
            document.getElementById("score").innerText = "Puntuación: 0";
            document.getElementById("saveScoreBtn").disabled = true;
            document.getElementById("saveScoreBtn").textContent = "Guardar puntuación";
            update();
        }

        function update() {
            if (gameOver) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rocket.draw();
            asteroid.draw();
            moveAsteroid();
            checkCollision();
            
            requestAnimationFrame(update);
        }

        // Controls
        document.addEventListener("keydown", (e) => {
            if (gameOver) return;
            
            if (e.key === "ArrowLeft") {
                rocket.x = Math.max(0, rocket.x - 20);
            }
            if (e.key === "ArrowRight") {
                rocket.x = Math.min(canvas.width - rocket.width, rocket.x + 20);
            }
        });

        canvas.addEventListener("touchstart", (e) => {
            if (gameOver) return;
            
            const touchX = e.touches[0].clientX;
            const canvasRect = canvas.getBoundingClientRect();
            const relativeX = touchX - canvasRect.left;
            
            if (relativeX < canvas.width / 2) {
                rocket.x = Math.max(0, rocket.x - 20);
            } else {
                rocket.x = Math.min(canvas.width - rocket.width, rocket.x + 20);
            }
            
            // Prevent screen scrolling when playing
            e.preventDefault();
        }, { passive: false });

        // Buttons
        document.getElementById("saveScoreBtn").addEventListener("click", guardarPuntaje);
        document.getElementById("restartBtn").addEventListener("click", resetGame);
        
        // Botón para actualizar puntuaciones (opcional)
        document.getElementById("topScores").addEventListener("click", loadTopScores);
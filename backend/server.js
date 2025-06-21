require('dotenv').config(); // Cargar variables de entorno desde el archivo .env
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); 

const app = express();

app.use(cors()); // Habilitar CORS para permitir solicitudes desde otros dominios
app.use(express.json()); // Habilitar el análisis de JSON en las solicitudes

// Configuración de la base de datos MySQL
const dbConfig = {
    host: process.env.DB_HOST, // Dirección del host de la base de datos
    user: process.env.DB_USER, // Usuario de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña del usuario de la base de datos
    database: process.env.DB_NAME // Nombre de la base de datos
};

// Puerto en el que se ejecutará el servidor
const port = process.env.PORT || 3000;

// Función para obtener una conexión a la base de datos
async function getConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos MySQL.');
        return connection;
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err.stack);
        process.exit(1); 
    }
}

// al iniciar la base de datos
async function initDatabase() {
    let connection;
    try {
        connection = await getConnection();
        
        // creacion de la tabla "tasks" si no existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                priority ENUM('baja', 'media', 'alta') DEFAULT 'media',
                category VARCHAR(100),
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    } finally {
        if (connection) connection.end(); 
    }
}

// iniciarlizar la base de datos al iniciar la aplicación
initDatabase();


//  obtener todas las tareas
app.get('/tasks', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM tasks ORDER BY due_date ASC, priority DESC');
        res.json(rows); 
    } catch (err) {
        console.error('Error al obtener tareas:', err);
        res.status(500).json({ error: 'Error al obtener tareas' });
    } finally {
        if (connection) connection.end();
    }
});


app.get('/tasks/:id', async (req, res) => {
    const id = req.params.id; 
    let connection;
    
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json(rows[0]); 
    } catch (err) {
        console.error('Error al obtener tarea:', err);
        res.status(500).json({ error: 'Error al obtener tarea' });
    } finally {
        if (connection) connection.end();
    }
});


app.post('/tasks', async (req, res) => {
    const { title, description, due_date, priority, category } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'El título de la tarea es requerido.' });
    }

    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'INSERT INTO tasks (title, description, due_date, priority, category) VALUES (?, ?, ?, ?, ?)',
            [title, description || null, due_date || null, priority || 'media', category || null]
        );
        
        
        const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]); 
    } catch (err) {
        console.error('Error al agregar tarea:', err);
        res.status(500).json({ error: 'Error al agregar tarea' });
    } finally {
        if (connection) connection.end();
    }
});


app.put('/tasks/:id', async (req, res) => {
    const id = req.params.id; // ID de la tarea a actualizar
    const { title, description, due_date, priority, category, completed } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'El título de la tarea es requerido.' });
    }
    
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(
            'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, category = ?, completed = ? WHERE id = ?',
            [title, description || null, due_date || null, priority || 'media', category || null, completed || false, id]
        );
        
        
        const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json(rows[0]); 
    } catch (err) {
        console.error('Error al actualizar tarea:', err);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    } finally {
        if (connection) connection.end();
    }
});


app.patch('/tasks/:id/toggle', async (req, res) => {
    const id = req.params.id; 
    let connection;
    
    try {
        connection = await getConnection();
        
        const [rows] = await connection.execute('SELECT completed FROM tasks WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        
        const newState = !rows[0].completed;
        
        
        await connection.execute('UPDATE tasks SET completed = ? WHERE id = ?', [newState, id]);
        
        res.json({ id, completed: newState }); 
    } catch (err) {
        console.error('Error al actualizar estado de tarea:', err);
        res.status(500).json({ error: 'Error al actualizar estado de tarea' });
    } finally {
        if (connection) connection.end();
    }
});


app.delete('/tasks/:id', async (req, res) => {
    const id = req.params.id; 
    let connection;
    
    try {
        connection = await getConnection();
        const [result] = await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.status(200).json({ message: 'Tarea eliminada correctamente' }); // Confirmar eliminación
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    } finally {
        if (connection) connection.end();
    }
});

// iniciar el server
app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); 

const app = express();

app.use(cors()); 
app.use(express.json()); 

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const port = process.env.PORT || 3000;

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


async function initDatabase() {
    let connection;
    try {
        connection = await getConnection();
        
        
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

// Inicializar la base de datos al iniciar la aplicación
initDatabase();

// Ruta para obtener todas las tareas
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

// Ruta para obtener una tarea por ID
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

// Ruta para agregar una nueva tarea
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
        
        // Obtener la tarea recién creada
        const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error al agregar tarea:', err);
        res.status(500).json({ error: 'Error al agregar tarea' });
    } finally {
        if (connection) connection.end();
    }
});

// Ruta para actualizar una tarea
app.put('/tasks/:id', async (req, res) => {
    const id = req.params.id;
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
        
        // Obtener la tarea actualizada
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

// Ruta para actualizar el estado de completado
app.patch('/tasks/:id/toggle', async (req, res) => {
    const id = req.params.id;
    let connection;
    
    try {
        connection = await getConnection();
        // Primero obtenemos el estado actual
        const [rows] = await connection.execute('SELECT completed FROM tasks WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        // Invertimos el estado
        const newState = !rows[0].completed;
        
        // Actualizamos el estado
        await connection.execute('UPDATE tasks SET completed = ? WHERE id = ?', [newState, id]);
        
        res.json({ id, completed: newState });
    } catch (err) {
        console.error('Error al actualizar estado de tarea:', err);
        res.status(500).json({ error: 'Error al actualizar estado de tarea' });
    } finally {
        if (connection) connection.end();
    }
});

// Ruta para eliminar una tarea
app.delete('/tasks/:id', async (req, res) => {
    const id = req.params.id;
    let connection;
    
    try {
        connection = await getConnection();
        const [result] = await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.status(200).json({ message: 'Tarea eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    } finally {
        if (connection) connection.end();
    }
});

// Para compatibilidad con el código anterior
app.get('/items', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Verificar si existe la tabla items
        const [tables] = await connection.query('SHOW TABLES LIKE "items"');
        
        if (tables.length > 0) {
            const [rows] = await connection.execute('SELECT id, name FROM items');
            res.json(rows);
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error('Error al obtener ítems:', err);
        res.status(500).json({ error: 'Error al obtener ítems' });
    } finally {
        if (connection) connection.end();
    }
});

app.post('/items', async (req, res) => {
    res.redirect(307, '/tasks'); // Redirigir a la nueva API
});

app.delete('/items/:id', async (req, res) => {
    res.redirect(307, `/tasks/${req.params.id}`); // Redirigir a la nueva API
});

app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
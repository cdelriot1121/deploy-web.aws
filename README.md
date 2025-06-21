# TaskMaster - Gestión de Tareas

## Descripción
Este es un proyecto de práctica para aprender sobre el despliegue de aplicaciones web en Amazon Web Services (AWS). Consiste en una aplicación básica de gestión de tareas (todo-list) con frontend y backend separados.

## 🚀 Live Demo

Puedes acceder a la aplicación desplegada aquí:
[**Link**](http://taskmaster-front-bucket1112.s3-website-sa-east-1.amazonaws.com/)


---

## Arquitectura del Despliegue en AWS

Esta aplicación está desplegada en Amazon Web Services (AWS) utilizando los siguientes servicios:

* **Frontend (HTML, CSS, JavaScript):** Alojado en [Amazon S3](https://aws.amazon.com/s3/) como un sitio web estático.
* **Backend (Node.js Express):** Desplegado en una instancia [Amazon EC2](https://aws.amazon.com/ec2/) (Ubuntu Server) y gestionado con [PM2](https://pm2.keymetrics.io/).
* **Base de Datos (MySQL):** Gestionada por [Amazon RDS](https://aws.amazon.com/rds/) (Relational Database Service).


---

## Cómo Ejecutar Localmente (Desarrollo)

**Requisitos:**
* Node.js (LTS recomendado)
* MySQL (o un servicio de base de datos compatible)

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/cdelriot1121/deploy-web.aws.git
    ```
    ```
    cd deploy-web.aws
    ```
2.  **Configurar el Backend:**
    ```bash
    cd backend
    ```
    ```
    npm install
    ```
    
    
    ### Crea un archivo .env y configúralo con tus credenciales locales de MySQL

    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=task_db
    PORT=3000
    ```
    
3.  **Iniciar el Backend:**
    ```bash
    npm start
    ```
4.  **Abrir el Frontend:**
    Abre `index.html` directamente en tu navegador (o usa una extensión de servidor local como Live Server en VS Code si es necesario).

---

## Pruebas Automatizadas (CI/CD)

Este proyecto incluye un flujo de trabajo de GitHub Actions para realizar pruebas de integración (end-to-end) en el entorno desplegado. Esto asegura que la aplicación funciona correctamente después de cada cambio.

Para más detalles sobre los tests, consulta el archivo `.github/workflows/deploy-and-test.yml` y la carpeta `tests/`.

---

## Contacto

Si tienes alguna pregunta o sugerencia, montas un issue o directamente reporta en otro lugar :D
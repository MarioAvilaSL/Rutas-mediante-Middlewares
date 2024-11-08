const express = require('express');
const cors = require('cors');
const path = require('path');

const {Pool }= require('pg');

const pool = new Pool({
    host: '127.0.0.1',
    user: 'postgres',
    password: 'utm123',
    database: 'HR', 
    port: '5432'
});

const app = express();
const PORT= 3000;

// Middleware para proteger rutas basado en el rol del usuario
const roleControlMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role']; // headers
        
        if (allowedRoles.includes(userRole)) {
            next(); // Si el rol está permitido, continuar
        } else {
            res.status(403).json({
                message: 'ERROR 403 - Acceso denegado por rol insuficiente'
            });
        }
    };
};

app.use('/jobs', roleControlMiddleware(['admin']));





//middleware para proteger las rutas con una clave de acceso.
const accessControlMiddleware = (req, res, next) => {
    const apikey = req.headers['x-api-key'];
    if (apikey === '123UTM') { 
        next(); 
    } else {
        res.status(403).json({
            message: 'ERROR 404'
        });
    }
};
app.use('/jobs', accessControlMiddleware);



//endpoint para devolver todos los jobs 
app.get ('/jobs', async(req, res) =>{

    try{
        const client = await pool.connect();
        const result = await pool.query('select * from jobs');
        client.release();
        res.json(result.rows);


    }catch(err){
        console.log(err);
        res.status(500).json({error:'Error en el servidor'});

    }
});

//endpoint para devolver un job por id
app.get ('/jobs/:id', async(req, res)=>{
    const {id} = req.params;
    const query = 'select * from jobs where job_id=$1';
    const values = [id];
    try{
        const client= await pool.connect();
        const result = await pool.query(query,values);
        client.release();

        if(result.rowCount>0){
            res.json(result.rows);
        }else{
            res.status(500).json({mierror: 'No existe el trabajo'});
        }

    }catch(err){
        console.log(err);
        res.status(500).json({error:'Error en el servidor'});
    }
});

//ingresar
app.post ('/jobs', async(req, res)=> {
    const { job_id, job_tittle, min_salary, max_salary} = req.body;
    const query = 'INSERT INTO jobs(job_id, job_tittle, min_salary, max_salary) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [job_id, job_tittle, min_salary, max_salary];

    try {
        const client = await pool.connect();
        const result = await client.query(query, values);
        client.release();

        if (result.rowCount > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(500).json({ mierror: 'No se pudo insertar un job' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


//modificar
app.put('/jobs/:job_id', async(req, res)=> {
    const { job_id} = req.params;
    const { job_tittle, min_salary, max_salary} = req.body;
    const query = `
        UPDATE employees
	    SET job_tittle=$1, min_salary=$2, max_salary=$3
        WHERE job_id = $4
        RETURNING *`;
    const values = [job_tittle, min_salary, max_salary];

    try {
        const client = await pool.connect();
        const result = await client.query(query, values);
        client.release();

        if (result.rowCount > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ mierror: 'No se pudo encontrar el job para actualizar' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

//eliminar
app.delete('/jobs/:job_id', async(req, res) =>{
    const { job_id } = req.params;
    const query = 'DELETE FROM jobs WHERE job_id = $1 RETURNING *';
    const values = [job_id];

    try {
        const client = await pool.connect();
        const result = await client.query(query, values);
        client.release();

        if (result.rowCount > 0) {
            res.json({ mensaje: 'employee eliminado correctamente', job: result.rows[0] });
        } else {
            res.status(404).json({ mierror: 'No se encontró el employee para eliminar' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



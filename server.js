require("dotenv").config()
const express = require("express")
const pg = require("pg")
const app = express()
const client = new pg.Client(process.env.DATABASE_URL)
const port = process.env.PORT

app.use(express.json())
app.use(require("morgan")("dev"))

//Routes
//Get employees
app.get("/api/employees", async(req, res, next) => {
    try {
        const SQL = `SELECT * FROM employees`;
        const response = await client.query(SQL);
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
});

//Get departments
app.get("/api/departments", async(req, res, next) => {
    try {
        const SQL = `SELECT * FROM departments`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
});

//Create employee
app.post("/api/employees", async(req, res, next) => {
    try {
        const SQL = `
            INSERT INTO employees(name, department_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id
        ]);

        res.status(201).send(response.rows[0]);
    } catch (error) {
        next(error)
    }
});

//Update employee
app.put("/api/employees/:id", async(req, res, next) => {
    try {
        const SQL = `
            UPDATE employees
            SET name=$1, department_id=$2, updated_at=now()
            WHERE id=$3
            RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
            req.params.id
        ]);

        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
});

//Delete Employee
app.delete("/api/employees/:id", async(req, res, next) => {
    try {
        const SQL = `DELETE FROM employees WHERE id=$1`;
        const response = await client.query(SQL, [
            req.params.id
        ]);

        res.sendStatus(204);
    } catch (error) {
        next(error)
    }
});

//Error handling
app.use((error, req, res, next) => {
    res.status(res.status || 500).send({
        error: error,
    });
});

const init = async () => {
    await client.connect()

    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;

        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );

        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id)
        );
    `;

    await client.query(SQL);
    console.log("Tables created");
    
    SQL = `
        INSERT INTO departments(name) VALUES('Information Technology');
        INSERT INTO departments(name) VALUES('Supply Chain');
        INSERT INTO departments(name) VALUES('Human resources');

        INSERT INTO employees(name, department_id) VALUES('Sravan Taraknath', 1);
        INSERT INTO employees(name, department_id) VALUES('Julian Bias', 1);
        INSERT INTO employees(name, department_id) VALUES('Tyler Bos', 2);
        INSERT INTO employees(name, department_id) VALUES('Andrew Yang', 3);
    `;

    await client.query(SQL);
    console.log("Data Seeded");
    

    app.listen(port, () => console.log(`Listening on port ${port}`));
}

init();
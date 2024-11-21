const {program} = require("commander")
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const swaggerJSDoc = require("swagger-jsdoc")
const swaggerUI = require('swagger-ui-express')

program
    .requiredOption('-h, --host <host>', 'Your host')
    .requiredOption('-p, --port <port>', 'Your port')
    .requiredOption('-c, --cache <cache>', 'Your cache')

program.parse()
const opts = program.opts()

if (!fs.existsSync(opts.cache)) {
    fs.promises.writeFile(opts.cache, JSON.stringify(Array()))
}

const app = express()
app.listen(opts.port, opts.host, () => {
    console.log(`Server run on http://${opts.host}:${opts.port}`)
})

const options = {
    failOnErrors: true,
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Створювач нотаток',
        version: '1.0.0',
      },
    },
    apis: ['index.js'],
};
  
const openapiSpecification = swaggerJSDoc(options);

app.use(express.text())
app.use('/docs', swaggerUI.serve, swaggerUI.setup(openapiSpecification));

/**
 * @swagger
 * /notes:
 *  get:
 *   summary: Отримати список усіх нотаток
 *   tags:
 *    - notes
 *   responses:
 *    '200':
 *      description: Успіх
 *      content:
 *        json:
 *         schema:
 *          items:
 *           type: object
 *           properties:
 *            name:
 *             type: string
 *            text:
 *             type: string
 *          example: [{"name1":"text1"}, {"name2":"text2"}]
 */

app.get('/notes', (req, res) => {
    fs.promises.readFile(opts.cache)
        .then((notes) => {
            res.status(200).type('json').send(notes)
        })
})

/**
 * @swagger
 * /notes/{note_name}:
 *  get:
 *   summary: Отримати текст нотатки з ім'ям "note_name"
 *   tags:
 *    - notes
 *   parameters:
 *    - name: note_name
 *      in : path
 *      requested: true
 *      schema:
 *        type: string
 *   responses:
 *    '200':
 *      description: Успіх
 *      content:
 *        text:
 *         schema:
 *          example: "note text"
 *    '404':
 *       description: Такої нотатки не існує
 */

app.get('/notes/:name', (req, res) => {
    fs.promises.readFile(opts.cache)
        .then(json_notes => {
            notes = JSON.parse(json_notes)
            notes.forEach(el => {
                if (el.name === req.params.name) {
                    res.status(200).type('text').send(el.text)
                }
            })
            res.status(404).end()
        })
})

/**
 * @swagger
 * /notes/{note_name}:
 *  put:
 *   summary: Змінити вміст нотатки "name" на інший
 *   tags:
 *    - notes
 *   parameters:
 *    - name: note_name
 *      in: path
 *      requested: true
 *      schema:
 *       type: string
 *   requestBody:
 *      requested: true
 *      content:
 *       text/plain:
 *        type: string
 *   responses:
 *     '201':
 *       description: Вміст змінено
 *     '404':
 *       description: Такої нотатки не існує
 */

app.put('/notes/:name', (req, res) => {
    fs.promises.readFile(opts.cache)
        .then(json_notes => {
            notes = JSON.parse(json_notes)
            for (let i = 0; i < notes.length; i++) {
                if (notes[i].name === req.params.name) {
                    notes[i].text = req.body
                    fs.promises.writeFile(opts.cache, JSON.stringify(notes))
                    res.status(201).end()
                }
            }
            res.status(404).end()
        })
})

/**
 * @swagger
 * /write:
 *  post:
 *   tags:
 *    - add
 *   summary: Додати нову нотатку
 *   requestBody:
 *    requested: true
 *    content:
 *     multipart/form-data:
 *      schema:
 *       type: object
 *       properties:
 *        note_name:
 *         type: string
 *        note:
 *         type: string
 *   responses:
 *     '201':
 *       description: Нотатку створено
 *     '400':
 *       description: Нотатка вже існує
 */

app.post('/write', multer().none(), (req, res) => {
    fs.promises.readFile(opts.cache)
        .then(json_notes => {
            notes = JSON.parse(json_notes)
            let found = false
            notes.forEach(el => {
                if (el.name === req.body.note_name) {
                    found = true
                }
            })
            if (found) {
                res.status(400).end()
            } else {
                notes.push({
                    "name" : req.body.note_name,
                    "text" : req.body.note
                })
                fs.promises.writeFile(opts.cache, JSON.stringify(notes))
                res.status(201).end()
            }
        })
})

/**
 * @swagger
 * /notes/{note_name}:
 *  delete:
 *   tags:
 *    - notes
 *   parameters:
 *    - name: note_name
 *      requested: true
 *      in: path
 *      schema:
 *       type: string
 *   responses:
 *    '200':
 *      description: Нотатку видалено
 *    '404':
 *      description: Такої нотатки не існувало
 */

app.delete('/notes/:name', (req, res) => {
    fs.promises.readFile(opts.cache)
        .then(json_notes => {
            notes = JSON.parse(json_notes)
            new_notes = []
            let found = false
            notes.forEach(el => {
                if (el.name === req.params.name) {
                    found = true
                } else {
                    new_notes.push(el)
                }
            })
            if (found) {
                fs.promises.writeFile(opts.cache, JSON.stringify(new_notes))
                res.status(200).end()
            } else {
                res.status(404).end()
            }
        })
})

/**
 * @swagger
 * /UploadForm.html:
 *  get:
 *   tags:
 *    - form
 *   responses:
 *    '200':
 *     description: Форма успішно виведена
 *     content:
 *      text/html:
 *       type: string
 */

app.get('/UploadForm.html', (req, res) => {
    fs.promises.readFile('UploadForm.html')
        .then(form => {
            res.status(200).type('html').send(form)
        })
})
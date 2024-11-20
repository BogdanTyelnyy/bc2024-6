const {program} = require("commander")
const express = require('express')
const fs = require('fs')
const multer = require('multer')

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

app.use(express.text())

app.get('/notes', (req, res) => {
    fs.promises.readFile(opts.cache)
        .then((notes) => {
            res.status(200).type('json').send(notes)
        })
})

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

app.get('/UploadForm.html', (req, res) => {
    fs.promises.readFile('UploadForm.html')
        .then(form => {
            res.status(200).type('html').send(form)
        })
})
const { IncomingForm } = require('formidable');
const { readTasksFromFile, writeTasksToFile } = require("../utils/fileHandler");
const { copyFileSync, unlinkSync } = require('fs');
const path = require('path');

exports.getTasks = (req, res) => {
    const tasks = readTasksFromFile();
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(tasks));
};

exports.createTask = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error parsing form' }));
            return;
        }

        const tasks = readTasksFromFile();
        const image = files.image?.[0];

        const newTask = {
            id: Date.now(),
            title: fields.title,
            description: fields.description || '',
            status: fields?.status || 'pending',
            image: image ? `/uploads/${image.originalFilename}` : null,
        };

        tasks.push(newTask);
        writeTasksToFile(tasks);

        if (image) {
            copyFileSync(image.filepath, path.join(__dirname, '../uploads', image.originalFilename));
        }

        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(JSON.stringify(newTask));
    });
};

exports.updateTask = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error parsing form' }));
            return;
        }

        const tasks = readTasksFromFile();
        const taskId = parseInt(fields.id);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task not found' }));
            return;
        }

        const updatedTask = {
            ...tasks[taskIndex],
            title: fields.title || tasks[taskIndex].title,
            description: fields.description || tasks[taskIndex].description,
            status: fields.status || tasks[taskIndex].status,
        };

        if (files.image) {
            const image = files.image[0];
            updatedTask.image = `/uploads/${image.originalFilename}`;
            copyFileSync(image.filepath, path.join(__dirname, '../uploads', image.originalFilename));
        }

        tasks[taskIndex] = updatedTask;
        writeTasksToFile(tasks);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(updatedTask));
    });
};

exports.deleteTask = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields) => {
        if (err) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error parsing form' }));
            return;
        }

        const tasks = readTasksFromFile();
        const taskId = parseInt(fields.id);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task not found' }));
            return;
        }

        const taskToDelete = tasks[taskIndex];
        if (taskToDelete.image) {
            const imagePath = path.join(__dirname, '..', taskToDelete.image);
            try {
                unlinkSync(imagePath);
            } catch (e) {
                console.error(`Error deleting image: ${e.message}`);
            }
        }

        tasks.splice(taskIndex, 1);
        writeTasksToFile(tasks);

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'Task deleted successfully' }));
    });
};

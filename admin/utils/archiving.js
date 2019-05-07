const fs = require("fs");
const archiver = require("archiver");

const archiveFile = ({outputPath, originFile}) => {
    let output = fs.createWriteStream(outputPath);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });
    output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    output.on('end', () => {
        console.log('Data has been drained');
    });
    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            throw err;
        }
    });
    archive.on('error', (err) => {
        throw err;
    });
    archive.pipe(output);
    const file = originFile.path;
    archive.append(fs.createReadStream(file), {name: originFile.filename});
    archive.finalize();
}

const archiveMultipleFiles = ({outputPath, files}) => {
    let output = fs.createWriteStream(outputPath);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });
    output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    output.on('end', () => {
        console.log('Data has been drained');
    });
    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            throw err;
        }
    });
    archive.on('error', (err) => {
        throw err;
    });
    archive.pipe(output);
    for(let file of files) {
        archive.append(fs.createReadStream(file.path), {name: file.name});
    }
    archive.finalize();
}

module.exports = { archiveFile, archiveMultipleFiles };
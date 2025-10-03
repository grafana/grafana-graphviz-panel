const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs').promises;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DOT_FILE_PATH = path.join(UPLOAD_DIR, 'diagram.dot');

const DEFAULT_DOT_DIAGRAM = `digraph HowToUploadDotFile {
  node [shape=box];
  
  Start [shape=circle];
  FileUploadedYet [label="File\\nuploaded\\nyet?", shape=diamond];
  CreateFile [label="Create file: my.dot\\ndigraph { A -> B; }"];
  Upload [label="Upload:\\ncurl -X POST -F file@my.dot\\nhttp://localhost:3001/dot"];
  Download [label="Download:\\ncurl http://localhost:3001/dot"];
  NeedChanges [label="Needs\\nchanges?", shape=diamond];
  End [shape=circle];
  
  Start -> FileUploadedYet;
  FileUploadedYet -> Upload [label="No"];
  FileUploadedYet -> CreateFile [label="Yes"];
  CreateFile -> Upload;
  Upload -> Download;
  Download -> NeedChanges;
  NeedChanges -> Upload [label="Yes"];
  NeedChanges -> End [label="No"];
}`;

(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
})();

fastify.register(require('@fastify/cors'), {
  origin: '*',
});

fastify.register(require('@fastify/multipart'));

fastify.post('/dot', async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    await fs.writeFile(DOT_FILE_PATH, buffer);

    fastify.log.info(`DOT file uploaded: ${data.filename}`);
    return reply.send({ 
      success: true, 
      message: 'DOT file uploaded successfully',
      filename: data.filename,
      size: buffer.length
    });
  } catch (error) {
    fastify.log.error('Upload error:', error);
    return reply.code(500).send({ error: 'Failed to upload file' });
  }
});

fastify.get('/dot', async (request, reply) => {
  try {
    const content = await fs.readFile(DOT_FILE_PATH, 'utf-8');
    return reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .send(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return reply
        .header('Content-Type', 'text/plain; charset=utf-8')
        .send(DEFAULT_DOT_DIAGRAM);
    }
    fastify.log.error('Read error:', error);
    return reply.code(500).send({ error: 'Failed to read file' });
  }
});

fastify.get('/health', async (request, reply) => {
  return reply.send({ status: 'ok' });
});

const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0';
    const port = process.env.PORT || 3001;
    
    await fastify.listen({ host, port });
    console.log(`\n🚀 Mock DOT file server running!`);
    console.log(`   POST files to: http://localhost:${port}/dot`);
    console.log(`   GET file from: http://localhost:${port}/dot\n`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();


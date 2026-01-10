import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
	if (req.url === '/hello' && req.method === 'GET') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ message: 'hello' }));
		return;
	}

	res.writeHead(404, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
	console.log(`Test with: curl http://localhost:${PORT}/hello`);
});

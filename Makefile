build:
	docker build -t edfora/cmsds .

run:
	docker rm -f cmsds || true
	docker run --name cmsds edfora/cmsds

run-all:
	make build
	make run

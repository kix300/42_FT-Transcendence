.PHONY: build up down logs clean rebuild

build:
	docker-compose build

up: build
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v

re: fclean up

fclean: clean
	docker system prune -a --volumes

rebuild: clean build up
FILE			= 	docker/docker-compose.yaml
DOCKER_COMPOSE	=	docker compose -f ./$(FILE)


all: init build up

init:
	mkdir -p ./database
	chmod 777 ./database
	chmod 777 ./database/database.db
	mkdir -p ./frontend/dist
	chmod 777 ./frontend/dist
	chmod 777 ./backend/uploads

build:
	$(DOCKER_COMPOSE) build

up: build
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs -f

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans

status:
	docker ps

re: fclean init up

fclean: clean
	docker system prune -a --volumes

rebuild: clean build up



.PHONY: build up down logs clean rebuild
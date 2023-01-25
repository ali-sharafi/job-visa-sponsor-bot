COMPOSE_FILES=./docker-compose.yml
ROOT_USER=root

help:
	@echo "make file"

up:
	docker-compose -f $(COMPOSE_FILES) --env-file ./.env up -d

down:
	docker-compose -f $(COMPOSE_FILES) down

shell:
	docker-compose --env-file ./.env -f $(COMPOSE_FILES) exec app sh

shell-as-root:
	docker-compose -f $(COMPOSE_FILES) exec --user=$(ROOT_USER) app sh

db:
	docker-compose -f $(COMPOSE_FILES) exec mongodb
# Flowfy

Welcome to the Flowfy repository! Flowfy is a Zapier alternative.

## Deployment using Docker Compose

To deploy the project using Docker Compose, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/Shookapic/Flowfy.git
    cd Flowfy
    ```

2. **Create a `.env` file**:
    Create a `.env` file in the root directory of the project and add your environment variables. Here is an example:
    ```env
    # (repo root).env
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_user_password
    DB_DATABASE=your_db_name
    POSTGRES_USER=your_user_in_db_container
    POSTGRES_PASSWORD=your_db_user_password_in_container
    POSTGRES_DB=your_db_name_in_container
    ```

3. **Build and run the containers**:
    Use Docker Compose to build and run the containers:
    ```bash
    (cd root repo)
    docker-compose up --build -d
    ```

4. **Access the application**:
    Once the containers are up and running, you can access the application at:
    - Frontend: [http://localhost/](http://localhost/)
    - Backend Documentation: [http://localhost:3000/doc](http://localhost:3000/doc)

## Stopping the containers

To stop the running containers, use the following command:
```bash
docker-compose down --volumes --remove-orphans
```

# Flowfy is accessbile at [Flowfy](http://localhost) and Flowfy doc is accessible at [Flowfy DOC](http://localhost:3000/doc) 

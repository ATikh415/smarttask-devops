pipeline {
    agent {
        docker {
            image 'docker:24-cli'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t $DOCKERHUB_USER/smarttask-backend:$IMAGE_TAG .'
                    sh 'docker tag $DOCKERHUB_USER/smarttask-backend:$IMAGE_TAG $DOCKERHUB_USER/smarttask-backend:latest'
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $DOCKERHUB_USER/smarttask-frontend:$IMAGE_TAG .'
                    sh 'docker tag $DOCKERHUB_USER/smarttask-frontend:$IMAGE_TAG $DOCKERHUB_USER/smarttask-frontend:latest'
                }
            }
        }

        stage('Login Docker Hub') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_USER --password-stdin'
            }
        }

        stage('Push Images') {
            steps {
                sh 'docker push $DOCKERHUB_USER/smarttask-backend:$IMAGE_TAG'
                sh 'docker push $DOCKERHUB_USER/smarttask-backend:latest'
                sh 'docker push $DOCKERHUB_USER/smarttask-frontend:$IMAGE_TAG'
                sh 'docker push $DOCKERHUB_USER/smarttask-frontend:latest'
            }
        }
    }

    post {
        success {
            echo 'Pipeline terminé avec succès.'
        }
        failure {
            echo 'Le pipeline a échoué — voir les logs ci-dessus.'
        }
        always {
            sh 'docker logout || true'
        }
    }
}

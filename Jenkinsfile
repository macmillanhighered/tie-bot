import jenkins.model.*;
import groovy.json.*;
import hudson.*;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

def artifactory_server = Artifactory.server 'Macmillan-Artifactory'
def rtDocker = Artifactory.docker server: artifactory_server
def app_name = "tie-bot"
def artifactory_target
def dockerRepo = '652911386828.dkr.ecr.us-east-1.amazonaws.com/cr/'
def buildType = 'dev'
def container_image
def artifact_name = "./provision/*"

pipeline {
  agent any
  options {
    ansiColor('xterm')
  }
  stages {
    stage ('Prepare Artifacts') {
      steps {
        script {
          def scmVars = checkout scm
          def branchName = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          def tag = sh(returnStdout: true, script: "git describe --exact-match \$(git rev-parse --short HEAD) || echo ''").trim()
          if ("${tag}" == "null" || "${tag}" == "") {
            tag = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          }
          def shortCommit = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()

          // build a unique, prefixed tag which includes human readable description
          dockerTag = "${buildType}-${tag}-${shortCommit}"

          artifactory_target = "Macmillan-Product-Builds/${app_name}/${tag}/"
          
          def downloadSpec = """{
                        "files": [
                            {
                                "pattern": "${artifactory_target}sha",
                                "target": "./"
                            }
                        ]
                    }"""

          def dl = artifactory_server.download(downloadSpec)
          def existingSHA = ""
          if (fileExists("${env.WORKSPACE}/${app_name}/${tag}/sha".toString())) {
            existingSHA = readFile file: "${env.WORKSPACE}/${app_name}/${tag}/sha".toString()
          }

          if ( existingSHA != dockerTag ) {

            // Login to Dockerhub
            withCredentials([
              usernamePassword(credentialsId: 'Docker_Hub_Login', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')
            ])
            {
                sh '''
                    docker login -u $USERNAME -p $PASSWORD
                '''
            }

            echo "No prior build matches current commit in this location, running build"
            echo "building ${app_name}:${env.BUILD_ID} with tag ${dockerTag}"
            def buildImage = docker.build("${dockerRepo}${app_name}:${dockerTag}")
            sh """
              aws ecr get-login-password \\
              --region us-east-1 \\
              | docker login \\
              --username AWS \\
              --password-stdin 652911386828.dkr.ecr.us-east-1.amazonaws.com
              docker push ${dockerRepo}${app_name}:${dockerTag}
            """

            writeFile file: "${env.WORKSPACE}/provision/sha".toString(), text: "${dockerTag}".toString()
            def serviceImage = "TIE_BOT_IMAGE=${dockerRepo}${app_name}:${dockerTag}"
            sh (
              """ echo ${serviceImage} > ./provision/.images
              """
              )

            def uploadSpec = """{
                          "files": [
                              {
                                  "pattern": "${artifact_name}",
                                  "target": "${artifactory_target}"
                              }
                          ]
                      }"""
            artifactory_server.upload(uploadSpec)
          }
        }
      }
    }
  }
  post {
    always {
      deleteDir()
    }
  }
}

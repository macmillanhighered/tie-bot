import jenkins.model.*;
import groovy.json.*;
import hudson.*;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

def artifactory_server = Artifactory.server 'Macmillan-Artifactory'
def rtDocker = Artifactory.docker server: artifactory_server
def app_name = "tie-bot"
def artifactory_target
def image_name = "${params.ARTIFACTORY_DOCKER_REGISTRY}/${params.SERVICE_NAME}"

def container_image


pipeline {
  agent any
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

          if ( existingSHA != scmVars.GIT_COMMIT ) {
            echo "No prior build matches current commit in this location, running build"
            echo "building ${app_name}:${env.BUILD_ID} with tag ${tag}"
            def buildImage
            docker.withRegistry('https://docker-dev.registry.sh.mml.cloud', 'artifactory-jenkins-user') {
              buildImage = docker.build("${app_name}:${scmVars.GIT_COMMIT}")
              buildImage.push(tag)
            }
            writeFile file: "${env.WORKSPACE}/provision/sha".toString(), text: "${scmVars.GIT_COMMIT}".toString()
            def serviceImage = "${app_name}_IMAGE=docker-dev.registry.sh.mml.cloud/${app_name}:${tag}"
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


          echo "building ${env.BUILD_ID} image ${image_name} with tag ${tag}"
          container_image = docker.build("${image_name}:${tag}")
	  
          sh """
            cp -R provision artifacts
            echo CONTAINER_IMAGE=${container_image.id} >> artifacts/.images
          """

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

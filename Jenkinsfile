def service = params.SERVICE_NAME


def artifactory_server = Artifactory.server 'Macmillan-Artifactory'
def rtDocker = Artifactory.docker server: artifactory_server

def artifactory_target = 'Macmillan-Product-Builds/${service}'
def image_name = "${params.ARTIFACTORY_DOCKER_REGISTRY}/${params.SERVICE}"

def version_tag
def container_image


pipeline {
  agent any
  stages {
    stage ('Prepare Artifacts') {
      agent any
      steps {
        script {
          def scmVars = checkout scm
          def branchName = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          version_tag = sh(returnStdout: true, script: "git describe --exact-match \$(git rev-parse --short HEAD) || echo ''").trim()
          if ("${version_tag}" == "null" || "${version_tag}" == "") {
            version_tag = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          }
	  
          
          echo "building service:${env.BUILD_ID} with tag ${version_tag}"
          container_image = docker.build("${image_name}:${version_tag}")
	  
          sh """
            mkdir -p artifacts
            touch .images
            echo CONTAINER_IMAGE=${container_image.id} >> artifacts/.images
            cp provision/docker-compose-swarm.yml artifacts/
            cp provision/.key  artifacts/.key
          """

        }
      }
    }

    stage ('Publish Artifacts') {
      steps {
	script {

          def uploadSpec = """{
                        "files": [
                            {
                                "pattern": "./artifacts/*",
                                "target": "${artifactory_target}"
                            }
                        ]
                    }"""

	  
	  def buildInfo = rtDocker.push(
	    image: container_image.id,
	    targetRepo: params.DOCKER_REGISTRY_NAME
	  )
	  artifactory_server.publishBuildInfo buildInfo

	  artifactory_target = "${artifactory_target}/${version_tag}/"

          artifactory_server.upload(uploadSpec)

	  
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

def artifactory_server = Artifactory.server 'Macmillan-Artifactory'
def rtDocker = Artifactory.docker server: artifactory_server

def artifactory_target = "Macmillan-Product-Builds/${params.SERVICE_NAME}"
def image_name = "${params.ARTIFACTORY_DOCKER_REGISTRY}/${params.SERVICE_NAME}"

def version_tag
def container_image


pipeline {
  agent any
  stages {
    stage ('Prepare Artifacts') {
      steps {
        script {
          def scmVars = checkout scm
          def branchName = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          version_tag = sh(returnStdout: true, script: "git describe --exact-match \$(git rev-parse --short HEAD) || echo ''").trim()
          if ("${version_tag}" == "null" || "${version_tag}" == "") {
            version_tag = scmVars.GIT_BRANCH.replaceFirst(/^.*\//, "")
          }
	  
          
          echo "building ${env.BUILD_ID} with tag ${version_tag}"
          container_image = docker.build("${image_name}:${version_tag}")
	  
          sh """
            cp -R provision artifacts
            echo CONTAINER_IMAGE=${container_image.id} >> artifacts/.images
          
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
                                "target": "${artifactory_target}/${version_tag}/"
                            }
                        ]
                    }"""

	  
	  def buildInfo = rtDocker.push(
	    image: container_image.id,
	    targetRepo: params.DOCKER_REGISTRY_NAME
	  )
	  artifactory_server.publishBuildInfo buildInfo
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

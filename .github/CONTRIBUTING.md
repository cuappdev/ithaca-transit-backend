# Contributing to Ithaca Transit Backend
👍🎉 First off, congrats on getting put on this pod 😂🎉👍

The following is a set of guidelines for contributing to our backend. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

# Making PRs
We want our PRs to be concise but informative. Some pointers as per our PR template:
* Your title should be able to summarize what changes you've made in one sentence. For example: "Exclude staff from the check for follows". For stacked PRs, please indicate clearly in the title where in the stack you are. For example: "[Eatery Refactor][4/5] Converted all files to MVP model"
* "Overview" should just summarize changes
* "Changes" should iclude details of what your changes actually are and how it is intended to work.
* "Test Coverage" should describe how you tested this feature. Manual testing and/or unit testing. Please include repro steps and/or how to turn the feature on if applicable. In the context of this repo, add a plan for how you intend to test on [integration](https://github.com/cuappdev/integration), with your newly created issue linked.
* "Next Steps" (if applicable) should describe how you plan on addressing future PRs if this is a part of a multi-PR change.
* "Related PRs or Issues" (if applicable) should list related PRs against other branches or repositories. This is often the case for our backend, because we work with two other repositories: [ithaca-transit-tcat-microservice](https://github.com/cuappdev/ithaca-transit-tcat-microservice) and [integration](https://github.com/cuappdev/integration).

# Versioning
We want to keep our [transit-node](https://hub.docker.com/repository/docker/cornellappdev/transit-node), [transit-ghopper](https://hub.docker.com/repository/docker/cornellappdev/transit-ghopper), and [transit-python](https://hub.docker.com/repository/docker/cornellappdev/transit-python) images synced with the right releases on our repositories. We update [releases on this repository](https://github.com/cuappdev/ithaca-transit-backend/releases) and [releases on ithaca-transit-microservice](https://github.com/cuappdev/ithaca-transit-tcat-microservice/releases). Everytime you decide to build a new Docker image and deploy onto our servers (transit-prod, transit-dev, and transit-bus), you must create a release on our master branch so that we know which commit corresponds to which image deployed. This way, if an error occurs, we can quickly diagnose the issue and roll back the last change that we know is safe. 
We keep a Dropbox Paper doc, [Transit Backend Versions](https://paper.dropbox.com/doc/Transit-Backend-Versions-RZD26Pqv1VGqOy04KEpQs) (which only AppDev member have access to), that keeps track of which versions are in sync. For example, two Docker images that must be kept in sync are transit-ghopper and transit-python because their GTFS static data *must* be the same, so we increase our versioning (ex. v1.1.1 -> v1.1.2) if we update the data--even if we don't change our code. This may result in jumps in versioning, so it may be the case that Github has releases v1.1.3 and v1.1.6, missing three versions in between as a result of data updates. This repository, unlike the microservice, does not have to worry about this issue: transit-node can have different versions as transit-ghopper and transit-python. 

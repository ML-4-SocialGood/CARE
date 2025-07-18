# CARE: Advancing Wildlife Conservation through AI-Driven Animal Re-Identification

CARE identifies animal species in images you provide, and re-identifies individual animals of those species.

## Table of Contents

- [Project Description](#project-description)
- [Contributors](#contributors)
- [Collaborators & Acknowledgements](#collaborators--acknowledgements)
- [Installer](#installer)
- [User Guide](#user-guide)
- [Development](#development)

## Project Description

New Zealand is home to some of the world’s most unique fauna, but these native species face significant threats from invasive pests. [One such predator is the stoat, which preys on the young of native birds.](https://www.doc.govt.nz/nature/pests-and-threats/animal-pests-and-threats/stoats) Our client has recognised this issue and tasked us with developing a web platform to assist in monitoring and controlling the presence of stoats on Waiheke Island. The platform leverages machine learning and artificial intelligence to accurately identify stoats and other animals captured in photos taken across the island. By utilising advanced image recognition algorithms, the platform can differentiate between various species, ensuring precise identification and effective monitoring. This innovative approach not only enhances the efficiency of pest control efforts but also contributes to the broader goal of preserving New Zealand’s unique biodiversity.

## Licence

CARE is licensed under the GNU Lesser General Public License v3.0.
See [LICENSE](LICENSE) for more information.

## Contributors

- [Yun Sing Koh](https://profiles.auckland.ac.nz/y-koh) (Professor at the School of Computer Science, University of Auckland)
- [Di Zhao](https://www.linkedin.com/in/di-zhao-56869498/) (4th-Year PhD Student)
- [Yihao Wu](https://www.linkedin.com/in/yihao-wu-justin327) (1st-Year PhD Student)
- [Matthew Alajas](https://www.linkedin.com/in/matthew-alajas-79762a136/) (Master Student)
- [Yuzhuo Li](https://www.linkedin.com/in/yuzhuo-li-a4a8b4245/) (Master Student)
- [Chris Pearce](https://github.com/cpearce) (Software Engineer)

## Collaborators & Acknowledgements

We would like to extend our sincere gratitude to Professor [Gillian Dobbie](https://profiles.auckland.ac.nz/g-dobbie), Dr. [Daniel Wilson](https://profiles.auckland.ac.nz/daniel-wilson), [Te Korowai o Waiheke](https://tekorowaiowaiheke.org/), and Capstone Team 39 for their invaluable contributions to this project. Their dedication, collaboration, and technical expertise have been instrumental in driving our work forward. We are also deeply grateful to Te Korowai o Waiheke for their support and partnership, whose commitment to environmental stewardship and community well-being continues to inspire and enrich our efforts. This project would not have been possible without the combined efforts of these outstanding partners.

## Installer

An installer is available. Please contact <a href="mailto:y.koh@auckland.ac.nz">Professor Yun Sing Koh</a> to get a copy of the installer.

## User Guide

The CARE Application comes with a comprehensive user guide, which can be found at the bottom of the platform.

## Development

In order to run the code in this repository, you need the model PT files. Please contact <a href="mailto:y.koh@auckland.ac.nz">Professor Yun Sing Koh</a> if you want a copy of the model files. We're working on a version of the model PT files that we can commit to the open source repository.

The application has two parts; the Electron user interface, and the Python AI model runner which does the actual detection and re-identification. See the [Python README.md](python/README.md) and [Electron README.md](care-electron/README.md) for specifics instructions on how to build and run the application.


![Logo](sides/logo.jpg)


# ToU Backend Documentation

This repository is one of three repositories that are part of a project at the Lebanese American University (LAU) in Byblos for the Software Engineering course (CSC490) given by [Mr. Charbel Daoud](https://github.com/NinjaCoder8) during the Spring semester of the year 2023. The developers are second year students at the university.

This particular project consists of a backend (current repository), a [website](https://github.com/brunoazar/ToU-WebFE), and a [mobile app](https://github.com/brunoazar/ToU-MobAppFE). The aim of the software is to give Lebanese clients a way to order and receive products from Amazon in the U.S.A in a reliable and fast way. This works by hiring a bunch of travelers who are already traveling to the U.S.A or want to make this their fulltime job to bring the desired product with them on their way back to Lebanon. The clients pay a little extra and the travelers and admin of the software will gain a commission.


## Acknowledgements

 - [Mr. Charbel Daoud](https://github.com/NinjaCoder8)


## Appendix

The backend code in this repository was developed using nodejs and uses multiple complex and hard-to-use npm libraries. The code also implements web-scraping as well as pdf-parsing to extract relevant information from the web and the travelers' plane tickets to improve the software's reliability and functionality.

We used AWS S3 bucket to upload the required files such as the travelers' tickets , IDs, CVs, and receipts. We also used MongoDB Atlas to host our MongoDB database online to be able to access it on any device.


## Authors

- [@chris-daou](https://github.com/chris-daou)
- [@vicken-kendirjian](https://github.com/vicken-kendirjian)


## Documentation

-[Pre-Development Documentation](sides/document.pdf)
-[PostDevelopment Documentation](sides/API%20documentation.pdf)


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`SECRET_JWT=bastermasojo24lmfkasjdhaksdhaskdhaskdjhaskdhaskdjhaskd`

`SECRET_REFRESH_JWT=kasjdhaksdjhakdhaksjdhaskjdhasjkdhakjsdhasdhaskdjh`

`SECRET_EMAIL=lepolelelepolpolele2348ydac`

`SECRET_CONFIRM_ORDER=asjkdhaksdjhaksjdhakjsdh95259`

`ACCESS_KEY=AKIAXRNYOKYLDWYXIJFV`

`ACCESS_SECRET=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`

`REGION=eu-north-1`

`BUCKET=toufiles`


## Features

- Cross platform
- Active 24/7
- International Delivery (From U.S.A To Lebanon)
## Lessons Learned

As one of our first major software projects, we faced multiple challenges along the way which we learned how to overcome using a combination of critical thinking, documentation, and some Googling. 

Since we barely had a month to implement this whole project, a very important lesson we learned was time management. We learned that when it's time to get serious, we should leave distractions and non-work related activities behind to focus on the task at hand. This led to a complete backend even before the deadline (not including linking).

Our teamworking skills have also greatly improved. We put in a lot of effort and worked collaboratively, around the clock, sometimes without sleep, to ensure that the project was completed at the highest level possible within the given timeframe. As a result, our teamworking skills were significantly enhanced, and we were able to deliver a successful outcome. 


## Related

Here are the related projects

- [The Mobile App](https://github.com/brunoazar/ToU-MobAppFE)    
- [The Website](https://github.com/brunoazar/ToU-WebFE)




## Tech Stack

*Client:* React/React-Native

*Server:* Node


## Used By

This system is used by:

- *Traveler*:
The Traveler's task is to bring orders with them from USA to Lebanon. These orders will be assigned to them according to their submitted Flight Ticket.
- *Client*:
The Client requests the amazon product by pasting the link in the application/website. This order will be assigned to a Traveler.


## Data Model Diagram

![Data Model Diagram](sides/ToU%20Data%20Model%20Diagram.jpg)


## Architectural Design

![Architectural Design](sides/Architectural%20Design.jpg)


## Support

For support, email chris.daou@lau.edu or vicken.kendirjian@lau.edu or join our Slack channel.


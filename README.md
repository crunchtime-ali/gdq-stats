# gdq-stats

> :space_invader: Stats webpage for [GamesDoneQuick](gamesdonequick.com). Hosted at [gdqstats.com](https://gdqstats.com)

## Frontend

The actual visualization is done by Recharts. Other tools used include:

- `React` + `Redux` for rendering and application dataflow
- `Webpack` + `Gulp` to generate / minify the site's assets
- `Hugo` for minor HTML templating
- `odometer` for animated odometers
- `C3js` for pie charts
- `day.js`

## Backend

This page uses [gdq-collector](https://github.com/crunchtime-ali/gdq-collector) to parse the GDQ donation tracker and to collect Twitch viewership information. This data is updated every minute.

Please visit that repo for more detailed information about the gdq-stats backend.

## Run it yourself

1. Clone the repo.
2. Run `npm install` to pull down the NPM dependencies.
3. Run `npm start` to build the site and start a local server.
4. Visit `http://localhost:3000` in your browser.

### Snapshot Previous Event

To take a snapshot of a previous event:

```
$ npm run snapshot --name=agdq-2024 # Replace w/ the current event name
```

## Previous Main Events

- [AGDQ 2025](https://gdqstats.com/previous-events/agdq-2025/)
- [SGDQ 2024](https://gdqstats.com/previous-events/sgdq-2024/)
- [AGDQ 2024](https://gdqstats.com/previous-events/agdq-2024/)
- [SGDQ 2023](https://gdqstats.com/previous-events/sgdq-2023/)
- [AGDQ 2023](https://gdqstats.com/previous-events/agdq-2023/)
- [AGDQ 2022](https://gdqstats.com/previous-events/agdq-2022/)
- [SGDQ 2021](https://gdqstats.com/previous-events/sgdq-2021/)
- [AGDQ 2021](https://gdqstats.com/previous-events/agdq-2021/) 
- [SGDQ 2020](https://gdqstats.com/previous-events/sgdq-2020/)
- [AGDQ 2020](https://gdqstats.com/previous-events/agdq-2020/)
- [AGDQ 2019](https://gdqstats.com/previous-events/agdq-2019/)
- [SGDQ 2018](https://gdqstats.com/previous-events/sgdq-2018/)
- [AGDQ 2018](https://gdqstats.com/previous-events/agdq-2018/)
- [SGDQ 2017](https://gdqstats.com/previous-events/sgdq-2017/)
- [AGDQ 2017](https://gdqstats.com/previous-events/agdq-2017/)
- [SGDQ 2016](https://gdqstats.com/previous-events/sgdq-2016/)

## Previous Side Events
- [Flame Fatales 2024](https://gdqstats.com/previous-events/flamefatales-2024/)

### Attribution

- [Benjamin Congdon](https://benjamincongdon.me/) - for developing the original backend and frontend of this application and operating it from 2016 through to 2022.
- [alligatr](http://alligatr.co.uk/) - for his previous years of doing SGDQ/AGDQ stats. The initial design of this site was heavily inspired by alligatr's past work.
- [David Ensinger](http://davidensinger.com/2013/08/how-i-use-reduce-to-minify-and-optimize-assets-for-production/) - for his great minifier Rakefile blog post

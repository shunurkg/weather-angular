import { ISummary } from './models/summary';
import{ITemperature} from './models/temperature';
import{Itpw} from './models/tpw';
import { IDayTile } from './models/dayTile';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Placeholder } from '@angular/compiler/src/i18n/i18n_ast';

@Injectable()
export class WeatherService {
  summary: ISummary;
  temperature:ITemperature;
  tpw:Itpw;
  dayWiseMap: any;
  dayTileList: Array<IDayTile>;
  chartdetails: Array<any>;
  constructor(private httpService: Http) {
    this.dayWiseMap = {};
    this.chartdetails=[];
  
  }

  updateDayInfoFor(dayNum: number) {
    // Get the day
    // Lookup in the day wise map for the dayNum
    // Update summary
    const dayInfoForDay = this.dayWiseMap[dayNum];
    console.log(dayInfoForDay);
    this.summary = {
      ...this.summary,
      // we are adding ... to append data to the existing one and in this summary v want that Place(say pune) to get displayed always so v add ...
      day: moment(dayInfoForDay[0].dt * 1000).format("dddd"),
      weatherCondition: dayInfoForDay[0].weather[0].description
    }
    this.temperature = {
      
      currentWeatherImageURL:"https://openweathermap.org/img/w/"+dayInfoForDay[0].weather[0].icon+".png",
      temperatureInCelcius: Math.round(dayInfoForDay[0].main.temp - 270),
      temperatureInKelvin:Math.round(dayInfoForDay[0].temp- 270),
      temperatureInFahrenheit:Math.round((dayInfoForDay[0].temp - 270)*1.8+32)
    }
    this.tpw={
  
      temparature:Math.round(dayInfoForDay[0].main.temp - 270),
      pressure: Math.round(dayInfoForDay[0].main.pressure/10),
      windSpeed:Math.round(dayInfoForDay[0].wind.speed*2.23694)
     };
    
  }

  fetchWeatherInfo(cityName: string) {
    const url = `http://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=27d43832d2a4adcb97fcbfa23db130aa`;
    this.httpService.get(url)
      .subscribe((rsp) => {
        console.log(rsp.json());
        const data = rsp.json();
        this.summary = {
          cityName: data.city.name,
          day: moment(data.list[0].dt * 1000).format("dddd"),
          weatherCondition: data.list[0].weather[0].description
        };
        this.temperature={
          currentWeatherImageURL: "https://openweathermap.org/img/w/"+data.list[0].weather[0].icon+".png",
          temperatureInKelvin: data.list[0].main.temp,
          temperatureInCelcius: Math.round(data.list[0].main.temp-273.15),
          temperatureInFahrenheit: 9/5*(data.list[0].main.temp)+32
        };
        this.tpw={
          temparature:data.list[0].main.temp-270,
          pressure:data.list[0].main.pressure,
          windSpeed:data.list[0].wind.speed 
        };
        
        // Build day wise map
        data.list.forEach(date => {
          const dateValue = new Date(date.dt * 1000);
          const dayNum = dateValue.getDay();
          if (dayNum in this.dayWiseMap) {
            this.dayWiseMap[dayNum].push(date);
          } else {
            this.dayWiseMap[dayNum] = [date];
          }
        });
        console.log(this.dayWiseMap);

        const sortedMap = _.sortBy(this.dayWiseMap, (value) => {
          let dayOfWeek = new Date(value[0].dt * 1000).getDay();
          let today = new Date().getDay();
          const diff = dayOfWeek - today;
          return diff < 0 ? diff + 7 : diff;
        });

        console.log("sortedMap"+sortedMap);

        this.dayTileList = _.map(sortedMap, (obj) => {
          console.log("obj "+obj);
          const minTemp = _.reduce(obj.map(interval => interval.main.temp_min), (a, b) => a + b) / obj.length;
          const icon = obj[0].weather[0].icon;
          const iconId = 'http://openweathermap.org/img/w/'+icon+'.png'; 
          console.log("icon"+iconId);
          return {
            day: moment(obj[0].dt * 1000).format("ddd"),
            minTemp: _.round(minTemp - 270, 2),
            maxTemp: _.round(obj[0].main.temp_max - 270, 2),
            imageURL: iconId,
            dayNum: new Date(obj[0].dt * 1000).getDay()
          }
        });
        console.log("dayTileList"+this.dayTileList);
        const currentDayDetails = this.dayWiseMap[new Date().getDay()];
        console.log(currentDayDetails);
        this.chartdetails = currentDayDetails
        .map(tempInfoObj => {
          return [moment(tempInfoObj.dt * 1000).format('dddd, h:mm a'), tempInfoObj.main.temp]
        })
        console.log("chardata",this.chartdetails);
     
      
      });
    // Build data structure for the tiles
  }

}
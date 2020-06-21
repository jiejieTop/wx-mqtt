var mqtt = require('../../../utils/mqtt.js'); 
var util = require('../../../utils/util.js'); 
var app = getApp();
var client = getApp().globalData.client;

function mcShowSuccess(params) {
  wx.showToast({
    title: params,       //弹出提示 连接并订阅成功
    icon: 'success',
    duration: 1000,
  })
}
function mcShowNone(params) {
  wx.showToast({
    title: params,       //弹出提示 连接并订阅成功
    icon: 'none',
    duration: 1000,
  })
}
function mcShowLoading(params) {
  wx.showToast({
    title: params,       //弹出提示 连接并订阅成功
    icon: 'loading',
    duration: 50000,
  })
}

function showMqttSub(params) {
  console.log(client.client.messageIdToTopic);
}

Page({
  options: {
    addGlobalClass: true,
  },
  data: {
    mcStatusData: ["关闭", "打开"],
    statusData: {
      tableLamp: 1,
      floorLamp: 1,
      teleVision: 1,
      curtain: 1,
      airConditioning: 1,
      bathtub: 1,
      bathtubTemp: 42.6,
    },
    basics: 0,
    numList: [{
      name: '开始'
    }, {
      name: '等待'
    }, {
      name: '错误'
    }, {
      name: '完成'
    }, ],
    changeStatusData: {},
  },
  
  setPageData(value) {
    this.setData({
      statusData: value
    })
  },
  
  setPageJsonData(jsonstr) {
    var obj = JSON.parse(jsonstr); 
    this.setData({
      statusData: obj
    })
  },

  onChangStatus(event) {
    let id = event.currentTarget.id;
    let value = event.currentTarget.dataset['value'];
    this.data.statusData[id] = value;
    this.mcPublishMessage(client, this.data.statusData);
  },

  mcConnectMqttServer(c) {
    if (c.connectFlag == false) {

      if ((c.subTopic == '') || ( c.pubTopic )) {
        c.subTopic = c.pubTopic = util.randomString(10);
      }
      if (c.connectOptions.username == '') {
        c.connectOptions.username == util.randomString(10);
      }
      if (c.connectOptions.password == '') {
        c.connectOptions.password == util.randomString(10);
      }
      if (c.connectOptions.clientId == '') {
        c.connectOptions.clientId == util.randomString(10);
      }

      var host = 'wxs://' + c.serverDomain + '/mqtt'; //更新域名连接
      c.client = mqtt.connect(host, c.connectOptions);
      mcShowLoading("正在连接");
      c.client.on('connect', (err) => {
        c.connectFlag = true;
        mcShowSuccess("连接服务器成功");
        this.mcSubscribeTopic(c);
      })
      c.client.on('error', (error) => {
        console.log('连接失败:', error)
        mcShowNone("连接服务器失败")
      })
      c.client.on('reconnect', (error) => {
        console.log('正在重连:', error)
        mcShowLoading("正在重新连接");
      })
    }
  },

  mcSubscribeTopic(c, topicName = '') {
    if (topicName == '') {
      topicName = c.subTopic;
      console.log(topicName)
    }
    c.client.subscribe(topicName, (err, granted) => {  //订阅主题
      if (!err) {
        showMqttSub();
        c.subTopicFlag = true;
        this.mcSubTopicMessageHandle(c);
      }
    })
  },
  
  mcSubTopicMessageHandle(c) {
    if (client.subTopicFlag == true) {
      //服务器下发消息的回调
        c.client.on('message', (topic, payload) => {
        console.log(" 收到 topic:" + topic + " , payload :" + payload)
        this.setPageJsonData(payload);
      })
    }
  },
  
  mcPublishMessage(c, message, topicName = '', qos = 1) {
    if (topicName == '') {
      topicName = c.pubTopic;
      console.log(topicName)
    }
    var messageStr = JSON.stringify(message)
    c.client.publish(topicName, messageStr, { qos: qos, rein: false }, (error) => {
      if (!error) {
        console.log("发布成功")
      }
      else {
        console.log("发布失败")
      }
    })
  },

/**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(!app.globalData.consoleSwitch){
      console.log = ()=>{}
    }
    console.log("onLoad");
    this.mcConnectMqttServer(client);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onReady");
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onShow");
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("onHide");
  },
})

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Tabs, Table, Tag, Space, Badge, Divider, Button, Alert } from 'antd';
import moment from 'moment';
import { ArrowRightOutlined } from '@ant-design/icons';
import axios from 'axios';
const { TabPane } = Tabs;

function OrderDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      // 未登录，跳转到登录页面
      navigate('/login', { 
        state: { from: location.pathname }, // 保存当前路径用于登录后跳转
        replace: true 
      });
      return;
    }
    // 查找订单
    const handleSearch = async () => {    
        try {
          const response_outbound = await axios.get(`http://127.0.0.1:8080/api/bookings/${reference}`,
            {
              headers: {
                'Authorization': authToken // 设置Token到请求头
              }
            }
          );
          setOrder(response_outbound.data);

        } catch (err) {
          setError('搜索航班失败');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
    handleSearch()
  }, [reference]);


  // 格式化时间
  const formatDateTime = (dateTimeString: string) => {
    return moment(dateTimeString).format('YYYY-MM-DD HH:mm');
  };

  // 格式化状态
  const formatStatus = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Tag color="blue">已确认</Tag>;
      case 'COMPLETED':
        return <Tag color="green">已完成</Tag>;
      case 'CANCELLED':
        return <Tag color="red">已取消</Tag>;
      default:
        return <Tag color="gray">{status}</Tag>;
    }
  };

  // 渲染航班信息
  const renderFlightInfo = (bookingFlight: any) => {
    const flight = bookingFlight.flight;
    
    // 计算到达时间
    const departureDateTime = moment(`${flight.departureDate}T${flight.departureTime}`);
    // 假设飞行时间为2小时30分钟
    const arrivalDateTime = departureDateTime.clone().add(2, 'hours').add(30, 'minutes');
    const arrivalDate = arrivalDateTime.format('YYYY-MM-DD');
    const arrivalTime = arrivalDateTime.format('HH:mm:ss');
    const duration = '2小时30分钟';
    
    return (
      <Card 
        title={`${flight.flightNumber} - ${flight.flightType === 'OUTBOUND' ? '去程' : '返程'}`}
        key={bookingFlight.bookingFlightId}
      >
        <div className="flight-info">
          <div className="flight-route">
            <div className="flight-departure">
              <div className="flight-time">{formatDateTime(`${flight.departureDate}T${flight.departureTime}`)}</div>
              <div className="flight-airport">
                {flight.departureAirport.code} - {flight.departureAirport.name} ({flight.departureAirport.city})
              </div>
            </div>
            <div className="flight-arrow">
              <ArrowRightOutlined />
              <div className="flight-duration">{duration}</div>
            </div>
            <div className="flight-arrival">
              <div className="flight-time">{formatDateTime(`${arrivalDate}T${arrivalTime}`)}</div>
              <div className="flight-airport">
                {flight.destinationAirport.code} - {flight.destinationAirport.name} ({flight.destinationAirport.city})
              </div>
            </div>
          </div>
          <Divider />
          <div className="flight-details grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flight-airline">
              <span className="font-medium">航空公司:</span> {flight.airline || '中国国际航空'}
            </div>
            <div className="flight-aircraft">
              <span className="font-medium">机型:</span> {flight.aircraft || '波音737'}
            </div>
            <div className="flight-price">
              <span className="font-medium">票价:</span> ¥{bookingFlight.price.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // 关闭页面的函数
  const handleClose = () => {
    // 尝试使用window.close()关闭窗口（如果是通过window.open打开的）
    if (window.opener && window.opener !== window) {
      window.close();
    } else {
      // 否则返回上一页
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page flex justify-center items-center min-h-screen">
        <Card loading title="订单详情" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <Alert message={error || "未找到订单信息"} type="error" showIcon />
        <Button type="primary" onClick={handleClose} style={{ marginTop: 16 }}>
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="order-detail-page max-w-5xl mx-auto p-4">
      <Card 
        title="订单详情"
        extra={
          <Button type="primary" onClick={handleClose}>
            关闭
          </Button>
        }
      >
        <div className="order-header grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="order-reference">
            <span className="font-medium">订单号:</span> {order.reference}
          </div>
          <div className="order-status">
            <span className="font-medium">订单状态:</span> {formatStatus(order.status)}
          </div>
          <div className="order-time">
            <span className="font-medium">预订时间:</span> {formatDateTime(order.bookingTime)}
          </div>
        </div>
        
        <Divider />
        
        <div className="order-flights mb-6">
          <h3 className="text-xl font-semibold mb-4">航班信息</h3>
          {order.bookingFlights?.map((bookingFlight: any) => renderFlightInfo(bookingFlight)) || (
            <Alert message="未找到航班信息" type="warning" showIcon />
          )}
        </div>
        
        <Divider />
        
        <div className="order-passengers mb-6">
          <h3 className="text-xl font-semibold mb-4">乘客信息</h3>
          <Table
            dataSource={order.passengers || []}
            columns={[
              {
                title: '姓名',
                dataIndex: '',
                key: 'name',
                render: (_: any, record: any) => `${record.lastName} ${record.firstName}`,
              },
              {
                title: '电子邮箱',
                dataIndex: 'email',
                key: 'email',
              },
            ]}
            rowKey="passengerId"
            pagination={false}
            // emptyText="未找到乘客信息"
          />
        </div>
        
        <Divider />
        
        <div className="order-summary">
          <h3 className="text-xl font-semibold mb-4">订单摘要</h3>
          <div className="order-total max-w-md">
            <div className="flex justify-between py-2 border-b">
              <span>机票总价 ({order.passengers?.length || 0} 位乘客)</span>
              <span>¥{order.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg text-red-600 border-t mt-2">
              <span>应付总额</span>
              <span>¥{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default OrderDetailPage;    
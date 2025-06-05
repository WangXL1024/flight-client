import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Divider, Card, Alert, Tabs } from 'antd';
import moment from 'moment';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { TabsProps } from 'antd';

function OrderListPage() {
  const [currentTab, setCurrentTab] = useState('upcoming');
  const [upcomingOrders, setUpcomingOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');

    if (!storedUser || !authToken) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    const user = JSON.parse(storedUser);

    const handleSearch = async () => {    
      try {
        setLoading(true);
        const response = await axios.get(`http://127.0.0.1:8080/api/bookings/user/${user.userId}`, {
          headers: {
            'Authorization': authToken
          }
        });
        
        const upcomingOrdersData = [];
        const completedOrdersData = [];
        
        for (const order of response.data) {
          if(order.status === 'PENDING'){
            upcomingOrdersData.push(order);
          } else {
            completedOrdersData.push(order);
          }
        }
        
        setUpcomingOrders(upcomingOrdersData);
        setCompletedOrders(completedOrdersData);
      } catch (err) {
        setError('搜索航班失败');
      } finally {
        setLoading(false);
      }
    };
    
    handleSearch();
  }, []);

  const formatDate = (dateString: string) => {
    return moment(dateString).format('YYYY-MM-DD');
  };

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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: '行程',
      dataIndex: 'bookingFlights',
      key: 'itinerary',
      render: (bookingFlights:any) => {
        const outbound = bookingFlights.find((f:any) => f.flightType === 'OUTBOUND');
        const returnF = bookingFlights.find((f:any) => f.flightType === 'RETURN');
        
        const outboundInfo = outbound 
          ? `${outbound.flight.departureAirport.code} → ${outbound.flight.destinationAirport.code}`
          : '';
        
        const returnInfo = returnF 
          ? `${returnF.flight.departureAirport.code} → ${returnF.flight.destinationAirport.code}`
          : '';
        
        return (
          <div>
            <div>{outboundInfo}</div>
            {returnInfo && <div className="text-sm text-gray-500">{returnInfo}</div>}
          </div>
        );
      },
    },
    {
      title: '日期',
      dataIndex: 'bookingFlights',
      key: 'dates',
      render: (bookingFlights:any) => {
        const outbound = bookingFlights.find((f:any) => f.flightType === 'OUTBOUND');
        const returnF = bookingFlights.find((f:any) => f.flightType === 'RETURN');
        
        const outboundDate = outbound ? formatDate(outbound.flight.departureDate) : '';
        const returnDate = returnF ? formatDate(returnF.flight.departureDate) : '';
        
        return (
          <div>
            <div>{outboundDate}</div>
            {returnDate && <div className="text-sm text-gray-500">{returnDate}</div>}
          </div>
        );
      },
    },
    {
      title: '乘客',
      dataIndex: 'passengers',
      key: 'passengers',
      render: (passengers:any) => {
        return passengers.map((p:any) => `${p.lastName}${p.firstName}`).join(', ');
      },
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price:any) => `¥${price.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status:any) => formatStatus(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_:any, record:any) => (
        <Button 
          type="link" 
          onClick={() => window.location.href = `/orders/${record.reference}`}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 使用 items 数组定义标签页
  const tabItems: TabsProps['items'] = [
    {
      key: 'upcoming',
      label: `待出行 (${upcomingOrders.length})`,
      children: upcomingOrders.length > 0 ? (
        <Table 
          dataSource={upcomingOrders} 
          columns={columns} 
          // rowKey="bookingId" 
        />
      ) : (
        <Alert message="暂无待出行的订单" type="info" showIcon />
      ),
    },
    {
      key: 'completed',
      label: `历史订单 (${completedOrders.length})`,
      children: completedOrders.length > 0 ? (
        <Table 
          dataSource={completedOrders} 
          columns={columns} 
          // rowKey="bookingId" 
        />
      ) : (
        <Alert message="暂无历史订单" type="info" showIcon />
      ),
    },
  ];

  return (
    <div className="order-list-page">
      <h2>我的订单</h2>
      
      {/* 使用 items 属性定义标签页 */}
      <Tabs activeKey={currentTab} onChange={setCurrentTab} items={tabItems} />
    </div>
  );
}

export default OrderListPage;
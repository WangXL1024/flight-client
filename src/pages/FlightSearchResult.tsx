import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Table, Tag, Space, Button, Divider, Card, Alert } from 'antd';
import moment from 'moment';
import axios from 'axios';

function FlightSearchResult() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState<any>(null);
  const [outboundFlights, setOutboundFlights] = useState<any[]>([]);
  const [returnFlights, setReturnFlights] = useState<any[]>([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<any>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state) {
      setSearchParams(location.state);
      console.log(location.state)

      const handleSearch = async () => {    
        try {
          const response = await axios.post('http://127.0.0.1:8080/api/flights/search', {
            tripType:location.state.tripType,
            departureAirportCode: location.state.departureAirportCode,
            destinationAirportCode: location.state.destinationAirportCode,
            departureDate:location.state.departureDate,
            returnDate: location.state.tripType === 'ROUND_TRIP' ? location.state.returnDate : null
          });
          const outboundFlightData = []
          const returnFlightData = []
          for (const flight of response.data) {
              if (flight.flightType === 'outbound') {
                  outboundFlightData.push(flight);
              } else if (flight.flightType === 'return') {
                  returnFlightData.push(flight);
              }
          }
          setOutboundFlights(outboundFlightData);
          setReturnFlights(returnFlightData);
        } catch (err) {
          setError('搜索航班失败');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      handleSearch()
    }
  }, [location.state]);

  // 格式化时间
  const formatTime = (timeString: string) => {
    return moment(timeString, 'HH:mm:ss').format('HH:mm');
  };

  // 航班表格列配置
  const outboundColumns = [
    {
      title: '航班号',
      dataIndex: 'flightNumber',
      key: 'flightNumber',
    },
    {
      title: '出发',
      dataIndex: 'departureAirport',
      key: 'departure',
      render: (departureAirport: { name: string }, record: any) => (
            <div>
                <div>{departureAirport.name}</div>
                <div className="text-sm text-gray-500">
                    {formatTime(record.departureTime)}
                </div>
            </div>
        ),
    },
    {
      title: '到达',
      dataIndex: 'destinationAirport',
      key: 'destination',
      render: (destinationAirport: { name: string }, record: any) => (
          <div>
              <div>{destinationAirport.name}</div>
              {/* <div className="text-sm text-gray-500">
                  {formatTime(record.arrivalTime)}
              </div> */}
          </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price:any) => `¥${price.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_:any, record:any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedOutboundFlight(record)}
          disabled={selectedOutboundFlight?.flightId === record.flightId}
        >
          {selectedOutboundFlight?.flightId === record.flightId ? '已选择' : '选择'}
        </Button>
      ),
    },
  ];

  const returnColumns = [
    ...outboundColumns.slice(0, outboundColumns.length - 1),
    {
      title: '操作',
      key: 'action',
      render: (_:any, record:any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedReturnFlight(record)}
          disabled={selectedReturnFlight?.flightId === record.flightId}
        >
          {selectedReturnFlight?.flightId === record.flightId ? '已选择' : '选择'}
        </Button>
      ),
    },
  ];

  // 继续预订
  const continueBooking = () => {
    if (!selectedOutboundFlight) {
      alert('请选择去程航班');
      return;
    }

    if (searchParams.tripType === 'ROUND_TRIP' && !selectedReturnFlight) {
      alert('请选择返程航班');
      return;
    }

    // 导航到预订页面
    window.location.href = `/booking/${searchParams.tripType}/${selectedOutboundFlight.flightId}/${selectedReturnFlight?.flightId || ''}`;
  };

  return (
    <div className="flight-search-result">
      {!searchParams ? (
        <Alert message="请从首页搜索航班" type="info" showIcon />
      ) : (
        <>
          <div className="search-summary">
            <h2>
              {searchParams.tripType === 'ONE_WAY' ? '单程' : '往返'} 航班搜索结果
            </h2>
            <div className="search-details">
              <div>
                <Tag color="blue">{searchParams.departureAirportCode}</Tag>
                <span className="mx-2">→</span>
                <Tag color="green">{searchParams.destinationAirportCode}</Tag>
                <span className="mx-4">出发日期: {moment(searchParams.departureDate).format('YYYY-MM-DD')}</span>
              </div>
              {searchParams.tripType === 'ROUND_TRIP' && (
                <div>
                  <Tag color="green">{searchParams.destinationAirportCode}</Tag>
                  <span className="mx-2">→</span>
                  <Tag color="blue">{searchParams.departureAirportCode}</Tag>
                  <span className="mx-4">返程日期: {moment(searchParams.returnDate).format('YYYY-MM-DD')}</span>
                </div>
              )}
            </div>
          </div>

          <Divider />

          <Card title="去程航班">
            <Table 
              dataSource={outboundFlights} 
              columns={outboundColumns} 
              rowKey="flightId" 
              pagination={false}
            />
          </Card>

          {searchParams.tripType === 'ROUND_TRIP' && (
            <>
              <Divider />
              <Card title="返程航班">
                <Table 
                  dataSource={returnFlights} 
                  columns={returnColumns} 
                  rowKey="flightId" 
                  pagination={false}
                />
              </Card>
            </>
          )}

          <Divider />

          <div className="booking-actions">
            <Button 
              type="primary" 
              size="large"
              onClick={continueBooking}
              disabled={!selectedOutboundFlight || (searchParams.tripType === 'ROUND_TRIP' && !selectedReturnFlight)}
            >
              继续预订
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default FlightSearchResult;    
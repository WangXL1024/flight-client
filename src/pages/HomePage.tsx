import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Radio, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import axios from 'axios';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Option } = Select;
const { RangePicker } = DatePicker;

function HomePage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [form] = Form.useForm<{
    departureAirport: string;
    destinationAirport: string;
    dates: dayjs.Dayjs[] | dayjs.Dayjs;
  }>();
  const [airports, setAirports] = useState<any[]>([]);
  const [error, setError] = useState('');

  // 加载机场数据
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8080/api/airports');
        setAirports(response.data);
      } catch (err) {
        setError('获取机场数据失败');
        console.error(err);
      }
    };
    fetchAirports();
  }, []);

  // 交换出发地和目的地
  const swapLocations = () => {
    const { departureAirport, destinationAirport } = form.getFieldsValue(['departureAirport', 'destinationAirport']);
    // 增加空值保护，避免未选择时交换无效
    if (departureAirport || destinationAirport) {
      form.setFieldsValue({
        departureAirport: destinationAirport || departureAirport,
        destinationAirport: departureAirport || destinationAirport,
      });
    }
  };

  // 处理搜索提交
  const onFinish = (values: any) => {
    const departureDate = dayjs(values.dates).isValid() 
     ? dayjs(values.dates).format('YYYY-MM-DD') 
      : dayjs().format('YYYY-MM-DD');
    
    const returnDate = tripType === 'ROUND_TRIP' 
      ? (Array.isArray(values.dates) && values.dates[1]?.isValid() 
        ? dayjs(values.dates[1]).format('YYYY-MM-DD') 
        : null) 
      : null;

    const searchParams = {
      tripType,
      departureAirportCode: values.departureAirport,
      destinationAirportCode: values.destinationAirport,
      departureDate,
      returnDate,
    };

    console.log('搜索参数:', searchParams);
    navigate('/flights', { state: searchParams });
  };

  return (
    <div className="home-page">
      <div className="search-container">
        <div className="search-header">
          <Radio.Group 
            value={tripType} 
            onChange={(e) => {
              setTripType(e.target.value);
              form.setFieldsValue({ 
                dates: tripType === 'ONE_WAY' 
                  ? dayjs() 
                  : [dayjs(), dayjs().add(7, 'day')] 
              });
            }}
          >
            <Radio.Button value="ONE_WAY">单程</Radio.Button>
            <Radio.Button value="ROUND_TRIP">往返</Radio.Button>
          </Radio.Group>
        </div>

        <Form
          form={form}
          name="flightSearch"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            dates: tripType === 'ONE_WAY' ? dayjs() : [dayjs(), dayjs().add(7, 'day')],
          }}
        >
          <Divider style={{ margin: '16px 0' }} />

          <Space direction="horizontal" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <Form.Item
              name="departureAirport"
              rules={[{ required: true, message: '请选择出发地' }]}
            >
              <Select 
                placeholder="出发地"
                style={{ width: 'auto' }}  // 宽度自适应内容
                dropdownMatchSelectWidth={false}  // 下拉菜单宽度独立
              >
                {airports.map((airport) => (
                  <Option key={airport.code} value={airport.code}>
                    {`${airport.code} - ${airport.city} (${airport.name})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Button type="primary" shape="circle" onClick={swapLocations}>
              ↔
            </Button>

            <Form.Item
              name="destinationAirport"
              rules={[{ required: true, message: '请选择目的地' }]}
            >
              <Select 
                placeholder="目的地"
                style={{ width: 'auto' }}  // 宽度自适应内容
                dropdownMatchSelectWidth={false}  // 下拉菜单宽度独立
              >
                {airports.map((airport) => (
                  <Option key={airport.code} value={airport.code}>
                    {`${airport.code} - ${airport.city} (${airport.name})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="dates"
            rules={tripType === 'ROUND_TRIP' 
              ? [{ type: 'array', required: true, message: '请选择往返日期' }]
              : [{ required: true, message: '请选择出发日期' }]
            }
          >
            {tripType === 'ONE_WAY' ? (
              <DatePicker 
                placeholder="出发日期" 
                format="YYYY-MM-DD" 
              />
            ) : (
              <RangePicker 
                placeholder={['出发日期', '返程日期']}
                format="YYYY-MM-DD" 
                ranges={{ 
                  '今天': [dayjs(), dayjs()], 
                  '本周': [dayjs().startOf('week'), dayjs().endOf('week')] 
                }}
                disabledDate={(current) => {
                  const formValues = form.getFieldsValue();
                  return current && Array.isArray(formValues.dates) && formValues.dates[0]
                   ? current.isBefore(formValues.dates[0], 'day')
                    : false;
                }}
              />
            )}
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="search-button"
              icon={<SearchOutlined />}
            >
              搜索航班
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default HomePage;
    
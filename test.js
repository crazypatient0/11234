import React, {useEffect, useMemo, useRef, useState} from "react";
import "./style.css";
import iconImage1 from './icons/c-r.png';
import iconImage2 from './icons/c-g.png';
import iconImage3 from './icons/c-b.png';
import iconImage4 from './icons/c-y.png';
import iconImage5 from './icons/t-r.png';
import iconImage6 from './icons/t-g.png';
import iconImage7 from './icons/t-b.png';
// import iconImage8 from './icons/t-y.png';
// import iconImage9 from './icons/r-r.png';
// import iconImage10 from './icons/r-g.png';
// import iconImage11 from './icons/r-b.png';
// import iconImage12 from './icons/r-y.png';
import ttImage from './imgs/tt.png';
import mmImage from './imgs/mm.png';
import getdatatools from "./getdatetools"



/// 加一个projcet，time的过滤框

const GunttChart = (props) => {
        const {
            rowHeight = 40, ///数据行高
            width = "100%",
            bodyHeight = "calc(100% - 40px)",
            rowTitle = "project name", //首列名称
        } = props;
        const valueScrollRef = useRef();
        const timeScrollRef = useRef();
        const [offsetX, setOffsetX] = useState(0);
        const [offsetY, setOffsetY] = useState(0);
        const [translateX, setTranslateX] = useState(0);
        const [tooltipVisble, setTooltipVisble] = useState("none");
        const [tooltipData, setTooltipData] = useState(null);
        const [data, setData] = useState(null);
        const [rows, setRows] = useState(props.rows);
        const [dataSource, setDataSource] = useState(props.dataSource);
        const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'Weeks');
        const [weeks, setWeeks] = useState([]);
        const [months, setMonths] = useState([]);
        const [quarters, setQuarters] = useState([]);
        const [dayWidth, setDayWidth] = useState(80);
        const onScrollY = (e) => {
            valueScrollRef.current.scrollTop = e.target.scrollTop;
        };

        const onScrollX = (e) => {
            timeScrollRef.current.scrollLeft = e.target.scrollLeft;
        };

        const onWheel = (e) => {
            timeScrollRef.current.scrollLeft += e.deltaY;
            valueScrollRef.current.scrollLeft += e.deltaY;
        };

        const onMouseEnter = (e, value) => {
            console.log('mouseenter')
            setTooltipData(value);
            setTooltipVisble("block");
        };

        const onMouseMove = (e) => {
            e.nativeEvent.stopImmediatePropagation();
            const offset = ((e.clientX / document.body.clientWidth) * 100).toFixed(0);
            setTranslateX(offset);
            setOffsetX(e.clientX);
            setOffsetY(e.clientY);
        };

        const onMouseLeave = (e) => {
            setTooltipVisble("none");
        };

        // 向后端请求数据
        useEffect(() => {
            fetch('http://127.0.0.1:5000')
                .then(response => response.json())
                .then(data => setData(data))
                .catch(err => console.error(err));
        }, []);

        // 获取数据以后进行处理，生成rows和datasource，动态调整rows列的宽度
        useEffect(() => {
            if (data) {
                const projectNames = data.data.map(project => project.project_name);
                const cdbProjectIds = data.data.map(project => project.cdb_project_id);

                setRows(projectNames.map((name, index) => ({
                    title: `${cdbProjectIds[index]} - ${name}`,
                    key: cdbProjectIds[index],
                })));

                const newDataSource = data.data.map(project => ({
                    key: project.cdb_project_id,
                    lines: project.tasks.filter(task => task.milestone === 0).map((task, index) => ({
                        key: `${project.cdb_project_id}_${index}`,
                        task_id: task.task_id,
                        status: task.status,
                        mapped_category: task.mapped_category,
                        start_time: task.start_time,
                        end_time: task.end_time,
                        task_name: task.task_name
                    })),
                    points: project.tasks.filter(task => task.milestone === 1).map((task, index) => ({
                        key: `${project.cdb_project_id}_${index}`,
                        task_id: task.task_id,
                        status: task.status,
                        mapped_category: task.mapped_category,
                        start_time: task.start_time,
                        end_time: task.end_time,
                        task_name: task.task_name
                    }))
                }));

                setDataSource(newDataSource);
                // console.log(dataSource);
                // console.log(rows);  // 打印所有行
                setTimeout(() => {
                    const divs = document.querySelectorAll(".row_desc_container");
                    let maxWidth = 0;
                    divs.forEach(div => {
                        const width = div.offsetWidth;
                        console.log(width)
                        if (width > maxWidth) {
                            maxWidth = width;
                        }
                    });
                    divs.forEach(div => {
                        div.style.width = `calc(${maxWidth}px)`;
                    });
                }, 100);
            }
        }, [data]);

        // 对datasource进行打包
        const dataSourceMap = useMemo(() => {
            if (!dataSource) {
                return {}; // 返回空对象或其他默认值，表示当dataSource为undefined时的处理
            }

            const map = {};
            dataSource.forEach(data => {
                const {key, lines, points} = data;
                map[key] = {lines, points};
            });

            return map;
        }, [dataSource]);

        // 计算最早的一天
        const startDate = useMemo(() => {
            if (!dataSource || dataSource.length === 0 || (!dataSource[0].lines && !dataSource[0].points)) {
                return new Date(); // 返回当前日期或其他默认值，表示当dataSource为undefined或lines和points都为空时的处理
            }
            let earliestDate = new Date(dataSource[0].lines[0].start_time);
            dataSource.forEach(data => {
                if (data.lines && data.lines.length > 0) {
                    data.lines.forEach(task => {
                        let taskDate = new Date(task.start_time);
                        if (taskDate < earliestDate) {
                            earliestDate = taskDate;
                        }
                    });
                }
                if (data.points && data.points.length > 0) {
                    data.points.forEach(task => {
                        let taskDate = new Date(task.start_time);
                        if (taskDate < earliestDate) {
                            earliestDate = taskDate;
                        }
                    });
                }
            });
            earliestDate.setDate(earliestDate.getDate() - 1);
            console.log(earliestDate);
            return earliestDate;
        }, [dataSource]);

        // 计算最晚的一天
        const latestEndDate = useMemo(() => {
            if (!dataSource || dataSource.length === 0 || (!dataSource[0].lines && !dataSource[0].points)) {
                return new Date(); // 返回当前日期或其他默认值，表示当dataSource为undefined或lines和points都为空时的处理
            }

            let latestDate = new Date(startDate);
            dataSource.forEach(data => {
                if (data.lines && data.lines.length > 0) {
                    data.lines.forEach(task => {
                        let taskDate = new Date(task.end_time);
                        if (taskDate > latestDate) {
                            latestDate = taskDate;
                        }
                    });
                }
                if (data.points && data.points.length > 0) {
                    data.points.forEach(task => {
                        let taskDate = new Date(task.end_time);
                        if (taskDate > latestDate) {
                            latestDate = taskDate;
                        }
                    });
                }
            });
            console.log(latestDate);
            return latestDate;
        }, [dataSource, startDate]);


        const datesArray = useMemo(() => {
            let dates = [];
            let months = new Set();
            let quarters = new Set();
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate());

            let endDate = new Date(latestEndDate);
            endDate.setDate(endDate.getDate() + 2);

            while (true) {
                let year = currentDate.getFullYear().toString().substr(-2); //获取最后两位年份
                let month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 获取月份，加1并保证两位
                let date = currentDate.getDate().toString().padStart(2, "0"); // 获取日期并保证两位
                dates.push(`${year}-${month}-${date}`);
                months.add(getMonthName(currentDate));
                const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
                quarters.add(`Q${quarter}`);

                // 检查是否已经超过 endDate
                if (currentDate.getFullYear() > endDate.getFullYear() ||
                    (currentDate.getFullYear() === endDate.getFullYear() && currentDate.getMonth() >= endDate.getMonth())) {
                    break;
                }

                // 增加日期，考虑跨年情况
                if (currentDate.getMonth() === 11) {
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    currentDate.setMonth(0);
                } else {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }


            // console.log(startDate,latestEndDate)
            let startDateWeek = getdatatools.getYearWeek(startDate);
            let endDateWeek = getdatatools.getYearWeek(latestEndDate);
            // console.log(startDateWeek,endDateWeek)
            let startYear = startDate.getFullYear();
            let endYear = latestEndDate.getFullYear();
            let weeksArray = [];

            if (startYear === endYear) {
                // 两个日期在同一年
                for (let week = startDateWeek; week <= endDateWeek; week++) {
                    weeksArray.push(week);
                }
            } else {
                // 两个日期不在同一年，需要处理跨年的情况
                let totalWeeksStartYear = getdatatools.getYearWeek(new Date(startYear, 11, 31)); // 该年最后一天的周数
                let totalWeeksEndYear = endDateWeek; // 结束日期的周数

                // 先添加开始日期到年末的所有周
                for (let week = startDateWeek; week <= totalWeeksStartYear; week++) {
                    weeksArray.push(week);
                }

                // 再添加年初到结束日期的所有周
                for (let week = 1; week <= totalWeeksEndYear; week++) {
                    weeksArray.push(week);
                }
            }
            // console.log(weeksArray)
            setWeeks(weeksArray);
            console.log(months)
            setMonths(Array.from(months));
            setQuarters(Array.from(quarters));

            return dates;
        }, [startDate, latestEndDate]);


        function getMonthName(date) {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthIndex = date.getMonth();
            return monthNames[monthIndex];
        }

        // 缓存viemode
        useEffect(() => {
            localStorage.setItem('viewMode', viewMode);
        }, [viewMode]);

        const titleWidth = useMemo(() => {
            const boxc = document.querySelector(".boxc");
            if (boxc) {
                const containerWidth = boxc.offsetWidth;
                if (viewMode === "Days" && datesArray) {
                    const totalWidth = datesArray.length * 80;
                    console.log(totalWidth)
                    if (totalWidth > containerWidth) {
                        document.documentElement.style.setProperty('--day-width', `80px`);
                        setDayWidth(80)
                        return 80;
                    } else {
                        console.log(containerWidth / datesArray.length)
                        setDayWidth(containerWidth / datesArray.length)
                        return containerWidth / datesArray.length;
                    }
                }
                if (viewMode === "Weeks" && weeks) {
                    const totalWidth = weeks.length * 80;
                    console.log(weeks.length)
                    console.log(totalWidth)
                    if (totalWidth > containerWidth) {
                        setDayWidth(80/7)
                        document.documentElement.style.setProperty('--day-width', `80px`);
                        return 80;
                    } else {
                        console.log(weeks)
                        document.documentElement.style.setProperty('--day-width', `${(containerWidth / weeks.length) / 7}px`);
                        setDayWidth((containerWidth / weeks.length) / 7)
                        return containerWidth / weeks.length;
                    }
                }
                if (viewMode === "Months" && months) {
                    const totalWidth = months.length * 80;
                    if (totalWidth > containerWidth) {
                        setDayWidth(80)
                        return 80;
                    } else {
                        document.documentElement.style.setProperty('--day-width', `${(containerWidth / months.length)}px`);
                        setDayWidth((containerWidth / months.length) / 30)
                        return containerWidth / months.length;
                    }
                }
                if (viewMode === "Quarters" && quarters) {
                    const totalWidth = quarters.length * 80;
                    if (totalWidth > containerWidth) {
                        setDayWidth(80)
                        return 80;
                    } else {
                        document.documentElement.style.setProperty('--day-width', `${(containerWidth / quarters.length) }px`);
                        setDayWidth((containerWidth / quarters.length) / 90)
                        return containerWidth / quarters.length;
                    }
                }
            }
            return 80;
        }, [viewMode, datesArray]);

        const getWeekOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                currentDate = new Date(currentDate); // 将字符串转换为Date对象
                startDate = new Date(startDate);
                const startDay = startDate.getDay();
                // const currentDay = currentDate.getDay();
                // console.log(startDate, startDay)
                // console.log(currentDate, currentDay)
                const diffTime = Math.abs(currentDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // console.log(diffDays);
                const leftOffset = diffDays + startDay
                // console.log(leftOffset);
                return leftOffset;
            }
        };

        const getMonthOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                currentDate = new Date(currentDate); // 将字符串转换为Date对象
                startDate = new Date(startDate);
                const startDayOfMonth = startDate.getDate();
                // const currentDayOfMonth = currentDate.getDate();
                // console.log(startDate, startDayOfMonth);
                // console.log(currentDate, currentDayOfMonth);
                const diffTime = Math.abs(currentDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // console.log(diffDays);
                const leftOffset = diffDays + startDayOfMonth
                // console.log(leftOffset);
                return leftOffset;
            }
        };

        const getQuarterOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                startDate = new Date(startDate);
                const startmonth = startDate.getMonth();
                let quarterStartMonth;
                if (startmonth < 3) quarterStartMonth = 0;     // Q1: January, February, March
                else if (startmonth < 6) quarterStartMonth = 3; // Q2: April, May, June
                else if (startmonth < 9) quarterStartMonth = 6; // Q3: July, August, September
                else quarterStartMonth = 9;
                const quarterStartDate = new Date(startDate.getFullYear(), quarterStartMonth, 1);
                currentDate = new Date(currentDate); // 将字符串转换为Date对象


                const diffTime = Math.abs(currentDate - quarterStartDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return diffDays;
            }
        };


        const timeInterval = (start, end) => {
            const d1 = new Date(start);
            const d2 = new Date(end);
            const interval = d2.getTime() - d1.getTime() + 1;
            if (interval < 0) return 0;
            return Math.ceil(interval / 1000 / 60 / 60 / 24);
        };
        const timeInterval2 = (start, end) => {
            const d1 = new Date(start);
            const d2 = new Date(end);
            const interval = d2.getTime() - d1.getTime() + 1;
            if (interval < 0) return 0;
            return Math.ceil(interval / 1000 / 60 / 60 / 24);
        };
        useEffect(() => {
            const d1 = new Date(startDate);
            const d2 = new Date();
            const interval = d2.getTime() - d1.getTime();
            const days = Math.ceil(interval / 1000 / 60 / 60 / 24);
            valueScrollRef.current.scrollLeft = dayWidth * days;
        }, [dayWidth, startDate]);

        return (

            <>
                <div className="boxa">
                    <div className="titlea">
                        <img className="imga" src={ttImage} alt=""/>
                    </div>
                    <div className="boxb">
                        <div className="titleb">
                            <img className="imgb" src={mmImage} alt=""/>
                        </div>
                        <div className="boxc">
                            <div className="button-container">
                                {/*<button onClick={() => setViewMode('Days')}>Days</button>*/}
                                <button onClick={() => setViewMode('Weeks')}>Weeks</button>
                                <button onClick={() => setViewMode('Months')}>Months</button>
                                <button onClick={() => setViewMode('Quarters')}>Quarters</button>
                            </div>
                            <div className="container_wrapper" style={{width}}>
                                <div className="container" style={{display: "block"}}>
                                    <div className="rowTitle" style={{width: 250}}>
                                        {rowTitle || null}
                                    </div>
                                    <div
                                        className="header_container"
                                        ref={timeScrollRef}
                                        style={{
                                            marginLeft: 150
                                        }}
                                    >
                                        <div className="time_header_container">
                                            {viewMode === 'Days' &&
                                                datesArray.map((date, i) => (
                                                    <div key={i} className="time_header_item" style={{width: titleWidth}}>
                                                        {date}
                                                    </div>
                                                ))}
                                            {viewMode === 'Weeks' &&
                                                weeks.map((week, i) => (
                                                    <div key={i} className="time_header_item" style={{width: titleWidth}}>
                                                        Week {week}
                                                    </div>
                                                ))}
                                            {viewMode === 'Months' &&
                                                months.map((month, i) => (
                                                    <div key={i} className="time_header_item" style={{width: titleWidth}}>
                                                        {month}
                                                    </div>
                                                ))}
                                            {viewMode === 'Quarters' &&
                                                quarters.map((quarters, i) => (
                                                    <div key={i} className="time_header_item" style={{width: titleWidth}}>
                                                        {quarters}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    <div
                                        className="desc_container"
                                        onScroll={onScrollY}
                                        style={{height: bodyHeight, width: 250, display: "block"}}
                                    >
                                        {(rows ? rows : []).map((row) => (
                                            <div
                                                key={row.key}
                                                className="row_desc_container"
                                                style={{height: rowHeight, lineHeight: `${rowHeight}px`}}
                                            >
                                                {row.title}
                                            </div>
                                        ))}
                                    </div>
                                    <div
                                        className="val_container"
                                        ref={valueScrollRef}
                                        onScroll={onScrollX}
                                        onWheel={onWheel}
                                        style={{height: bodyHeight, display: "block"}}
                                    >
                                        {(rows ? rows : []).map((row) => (
                                            <div
                                                key={row.key}
                                                className="row_val_container"
                                                style={{
                                                    height: rowHeight,
                                                    lineHeight: `${rowHeight}px`,
                                                    // width: (timeInterval2(startDate, latestEndDate) * dayWidth + dayWidth)
                                                    width: (viewMode === "Days" ? (datesArray.length * titleWidth) : (viewMode === "Weeks" ? (weeks.length * titleWidth) : (viewMode === "Months" ? (months.length * titleWidth) : (quarters.length * titleWidth))))

                                                }}
                                            >
                                                {dataSourceMap[row.key] ? (
                                                    <>
                                                        {dataSourceMap[row.key].lines.map((line) => {
                                                            let backgroundColor;
                                                            if (line.task_name === "Follow-up Cost") {
                                                                backgroundColor = "#81ecec";
                                                            } else if (line.task_name === "Commissioning (internal)") {
                                                                backgroundColor = "#fab1a0";
                                                            } else if (line.task_name === "Facility qualification") {
                                                                backgroundColor = "#e84393";
                                                            } else if (line.task_name === "FAT") {
                                                                backgroundColor = "#e17055";
                                                            } else if (line.task_name === "LOP / FAT") {
                                                                backgroundColor = "#a29bfe";
                                                            } else if (line.task_name === "Disassembly") {
                                                                backgroundColor = "#fd79a8";
                                                            } else if (line.task_name === "Transportation") {
                                                                backgroundColor = "#ffeaa7";
                                                            } else if (line.task_name === "On-site Assembly") {
                                                                backgroundColor = "#b2bec3";
                                                            } else if (line.task_name === "On-site Commissioning") {
                                                                backgroundColor = "#2d3436";
                                                            }
                                                            let left;

                                                            if (viewMode === "Days") {
                                                                left = (timeInterval(startDate, line.start_time) - 1) * dayWidth;
                                                            } else if (viewMode === "Weeks") {
                                                                const weekOffset = getWeekOffset(startDate, line.start_time);
                                                                left = weekOffset * dayWidth;
                                                            } else if (viewMode === "Months") {
                                                                const monthOffset = getMonthOffset(startDate, line.start_time);
                                                                left = monthOffset * dayWidth;
                                                            } else if (viewMode === "Quarters") {
                                                                const quarterOffset = getQuarterOffset(startDate, line.start_time);
                                                                left = quarterOffset * dayWidth;
                                                            }
                                                            return (
                                                                <div
                                                                    key={line.key}
                                                                    onMouseEnter={(e) => onMouseEnter(e, line)}
                                                                    onMouseLeave={onMouseLeave}
                                                                    onMouseMove={onMouseMove}
                                                                    className="activity"
                                                                    style={{
                                                                        width: timeInterval2(line.start_time, line.end_time) * dayWidth,
                                                                        left: left,
                                                                        backgroundColor: backgroundColor || "#5e63b5", // 默认颜色
                                                                        height: 24
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                        {viewMode !== "Quarters" && dataSourceMap[row.key].points.map((point) => {
                                                            let iconImage;
                                                            if (point.task_name === "Order Intake") {
                                                                iconImage = iconImage1;
                                                            } else if (point.task_name === "Project Kick-off") {
                                                                iconImage = iconImage2;
                                                            } else if (point.task_name === "Procurement Start LLC") {
                                                                iconImage = iconImage3;
                                                            } else if (point.task_name === "Engineering Start") {
                                                                iconImage = iconImage4;
                                                            } else if (point.task_name === "Delivery to Site") {
                                                                iconImage = iconImage5;
                                                            } else if (point.task_name === "Operational Handover") {
                                                                iconImage = iconImage6;
                                                            } else if (point.task_name === "Customer Sign-off") {
                                                                iconImage = iconImage7;
                                                            }
                                                            let left;

                                                            if (viewMode === "Days") {
                                                                left = (timeInterval(startDate, point.start_time) - 1) * dayWidth + 0.5 * dayWidth - 7.5;
                                                            } else if (viewMode === "Weeks") {
                                                                const weekOffset = getWeekOffset(startDate, point.start_time);
                                                                left = weekOffset * dayWidth + 0.5 * dayWidth - 7.5;
                                                            } else if (viewMode === "Months") {
                                                                const monthOffset = getMonthOffset(startDate, point.start_time);
                                                                left = monthOffset * dayWidth + 0.5 * dayWidth - 7.5;
                                                            }
                                                            return (
                                                                <div
                                                                    key={point.key}
                                                                    onMouseEnter={(e) => onMouseEnter(e, point)}
                                                                    onMouseLeave={onMouseLeave}
                                                                    onMouseMove={onMouseMove}
                                                                    className="activity2"
                                                                    style={{

                                                                        // left: (timeInterval(startDate, point.start_time) - 1 + 0.5) * dayWidth - 7.5,
                                                                        left: left,
                                                                        height: 15,
                                                                        width: 15,
                                                                        backgroundImage: iconImage ? `url(${iconImage})` : null,
                                                                        backgroundSize: "contain",
                                                                        backgroundRepeat: "no-repeat",
                                                                        backgroundPosition: "center",
                                                                        borderRadius: "50%"
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </>
                                                ) : (
                                                    <></>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tooltip"
                                style={{
                                    left: offsetX,
                                    top: offsetY - 60,
                                    position: "fixed",
                                    display: tooltipVisble,
                                    transform: `translateX(-${translateX}%)`
                                }}
                            >
                                <div className="title">{tooltipData ? tooltipData.task_name : ""}</div>
                                <div className="time">
                                    {`${tooltipData ? tooltipData.start_time : ""} - ${
                                        tooltipData ? tooltipData.end_time : ""
                                    }`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
;

export default GunttChart;

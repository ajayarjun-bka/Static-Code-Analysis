from flask import Flask,request,render_template,redirect
import timeit
import memcache
import mysql.connector
import hashlib
import random





app = Flask(__name__)
conn = mysql.connector.connect(user='arjun', password='password',
                               host='ajaydb.cvwussyirvfn.us-west-2.rds.amazonaws.com',
                               database='lol')
cur=conn.cursor()
memc = memcache.Client(['plz.csyprq.0001.usw2.cache.amazonaws.com:11211'], debug=1)
@app.route('/')
def hello_world():
    return render_template("upload.html")


@app.route('/base')
def base():
    return render_template("base.html")

@app.route('/query', methods=['GET','POST'])
def query():
    Query1=request.form['query']
    cache=int(request.form['one'])
    print Query1
    print cache
    cur = conn.cursor()

    def execute_query(Que):
        start_time = timeit.default_timer()
        cur.execute(Que)
        finish_time_tmp = timeit.default_timer() - start_time
        print finish_time_tmp
        count = 0
        for rows in cur.fetchall():
            count = count + 1
        finish_time = timeit.default_timer() - start_time
        # print finish_time

    def nemcache():
        query_option = 1
        q1mc = memc.get('q1result')
        if query_option == 1:
            if not q1mc:
                start_time = timeit.default_timer()
                cur.execute(Query1)
                rows = cur.fetchall()
                memc.set('q1result', rows)
                finish_time_tmp = timeit.default_timer() - start_time
                print finish_time_tmp
                # finish_time = timeit.default_timer() - start_time
                # print finish_time
                res = Query1 + ' Execution time without memcache first time is ' + str(finish_time_tmp)
                return res
            else:
                count = 0
                start_time = timeit.default_timer()
                for row in q1mc:
                    count = count + 1
                finish_time_tmp = timeit.default_timer() - start_time
                print finish_time_tmp
                res = "loaded data from memcache" + str(finish_time_tmp)
                return res

    def no_memcache():
        start_time = timeit.default_timer()
        cur.execute(Query1)
        finish_time_tmp = timeit.default_timer() - start_time
        print finish_time_tmp
        count = 0
        for rows in cur.fetchall():
            count = count + 1
        finish_time = timeit.default_timer() - start_time
        return ("without memcache"+str(finish_time))


    if cache == 1:
        result = nemcache()
    if cache == 2:
        result= no_memcache()
    return render_template('result.html',result=result)


@app.route('/prefix',methods=['GET','POST'])
def prefix():
    number_of_times =int(request.form['nof'])
    cache = request.form['one']
    '''
    def mc_querries(sql):
        hash = hashlib.sha224(sql).hexdigest()
        sql_mc = memc.get(hash)
        if not sql_mc:
            # start_time = timeit.default_timer()
            cur.execute(sql)
            rows = cur.fetchall()
            # finish_time = timeit.default_timer() - start_time
            # print sql + ' Execution time without memcache time is ' + str(finish_time)
            memc.set(hash, rows)
        else:
            count
            # start_time = timeit.default_timer()
            rows = memc.get(hash)
            # finish_time = timeit.default_timer() - start_time
            # print sql + ' Execution time with memcache time is ' + str(finish_time)

    def querries(sql):
        hash = hashlib.sha224(sql).hexdigest()
        cur.execute(sql)
        rows = cur.fetchall()
        memc.set(hash, rows)'''

    ### main

    def nemcache(x):
        global count
        count=1
        start_time = timeit.default_timer()
        for i in range(1, x):
            rand_id = random.randint(2000,4000)
            sql = "SELECT * From md where id =" + str(rand_id)
            #mc_querries(sql)
            hash = hashlib.sha224(sql).hexdigest()
            sql_mc = memc.get(hash)
            if not sql_mc:
                # start_time = timeit.default_timer()
                cur.execute(sql)
                rows = cur.fetchall()
                # finish_time = timeit.default_timer() - start_time
                # print sql + ' Execution time without memcache time is ' + str(finish_time)
                memc.set(hash, rows)
            else:
                count=count+1
                # start_time = timeit.default_timer()
                rows = memc.get(hash)
                # finish_time = timeit.default_timer() - start_time
                # print sql + ' Execution time with memcache time is ' + str(finish_time)
        finish_time = timeit.default_timer() - start_time
        return ("Execution time with memcache time is " + str(finish_time)+"count "+str(count))

    def no_memcache(x):
        start_time = timeit.default_timer()
        for i in range(1, x):
            rand_id = random.randint(2000, 4000)
            sql = "SELECT * From md where id =" + str(rand_id)
            #querries(sql)
            hash = hashlib.sha224(sql).hexdigest()
            cur.execute(sql)
            rows = cur.fetchall()
            memc.set(hash, rows)
        finish_time = timeit.default_timer() - start_time
        return(' Execution time without memcache time is ' + str(finish_time))
    if cache == '1':
        result= nemcache(number_of_times)
        return (result)
    if cache =='2':
        result=no_memcache(number_of_times)
        return (result)

@app.route('/flush_all',methods=['GET','POST'])
def flush():
    memc.flush_all()
    return redirect("/base", code=302)





@app.route('/final',methods=['GET','POST'])
def upload():
    file = request.files['fileupload']
    txt= file.read()
    fn='/home/ubuntu/flaskapp/'+file.filename
    start_time = timeit.default_timer()
    ec2_file = open (fn,'wb')
    ec2_file.write(txt)
    end_time = timeit.default_timer()
    tot=end_time-start_time
    ec2_file.close()
    start_time = timeit.default_timer()
    #call('sh load.sh', shell=True)
    #call("sh /home/ubuntu/test/load.sh %s %s" %(str(filename),str(tb_name)), shell=True)
    end_time = timeit.default_timer()
    total_time = end_time - start_time
    print 'time taken to load file into table  =  ' + str(total_time)

    return ("Time taken to upload "+str(tot)+"<br><a href='/base'>GO TO HOME</a>")
if __name__ == '__main__':
    app.run()